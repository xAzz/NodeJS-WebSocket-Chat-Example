global.fs = require('fs');
global.http = require('http');
global.btoa = require('btoa');
global.WebSocket = require('ws');
global.JSON = require('circular-json');

class Server {
	constructor() {
		this.config = require('./config');

		this.ws = null;
		this.httpServer = http.createServer().listen(this.config.port);
		this.players = {};

		this.passwords = this.config.passwords;

		this.rooms = this.config.rooms;

		/* Banned IP's */
		this.ipBanList = [];
		this.ipBanFile = './ipbanlist.txt';

		this.entities = new Map();
		this.commands = new Map();
	}

	startServer() {
		this.ws = new WebSocket.Server({ server: this.httpServer });
		this.ws.on('connection', (ws, req) => this.onConnection(ws, req));
		console.log(`Server started on *:${this.config.port}`);
		this.loadEntities();
		this.loadIpBanList();
	}

	loadEntities() {
		fs.readdir('./entities/', (err, files) => {
			if (err) return console.error(err);

			const jsFile = files.filter(file => file.split('.').pop() === 'js');
			if (jsFile.length === 0) return console.log("Couldn't find any entities.");

			jsFile.forEach(file => {
				delete require.cache[require.resolve(`./entities/${file}`)];
				const props = require(`./entities/${file}`);
				this.entities.set(file.split('.js')[0], props);
			});
		});

		fs.readdir('./chatCommands/', (err, files) => {
			if (err) return console.error(err);

			const jsFile = files.filter(file => file.split('.').pop() === 'js');
			if (jsFile.length === 0) return console.log("Couldn't find any chatCommands.");

			jsFile.forEach(file => {
				delete require.cache[require.resolve(`./chatCommands/${file}`)];
				const props = require(`./chatCommands/${file}`);
				this.commands.set(props.help.name, props);
			});
		});
	}

	loadIpBanList() {
		try {
			if (fs.existsSync(this.ipBanFile)) {
				this.ipBanList = fs
					.readFileSync(this.ipBanFile, 'utf8')
					.split(/[\r\n]+/)
					.filter(x => x);
			} else {
				console.log(`${this.ipBanFile} is missing.`);
			}
		} catch (err) {
			console.log(err.stack);
			console.log(`Failed to save ${this.ipBanFile}: ${err.message}`);
		}
	}

	saveIpBanList() {
		try {
			let file = fs.createWriteStream(this.ipBanFile);
			this.ipBanList.sort().forEach(v => file.write(`${v}\n`));
			file.end();
		} catch (err) {
			console.log(err.stack);
			console.log(`Failed to save ${this.ipBanFile}: ${err.message}`);
		}
	}

	/**
	 * @param {string} ipAddress
	 */
	checkIPBan(ipAddress) {
		const ipBin = ipAddress.split('.');
		const subNet1 = `${ipBin[0]}.${ipBin[1]}.${ipBin[2]}.*`;
		const subNet2 = `${ipBin[0]}.${ipBin[1]}.*.*`;

		if (!this.ipBanList || ipAddress === '127.0.0.1') return false;
		if (this.ipBanList.includes(ipAddress)) return true;
		if (ipBin.length !== 4) return false;
		if (this.ipBanList.includes(subNet1) || this.ipBanList.includes(subNet2)) return true;
		return false;
	}

	/** @param {WebSocket} ws */
	onConnection(ws, req) {
		let id = 0;
		while (this.players.hasOwnProperty(++id));
		this.createPlayer(ws, id);
	}

	/** @param {WebSocket} ws */
	createPlayer(ws, id) {
		this.players[id] = new Player(this, ws, id);
		ws.on('message', data => this.players[id].onMessage(data));
		ws.on('close', () => {
			if (this.players[id].info.isConnected && Object.keys(this.players).length > 0) this.broadCast(this.emitMessage(`${this.players[id].info.name} left`));
			if (this.players[id]) this.removePlayer(id);
		});

		if (this.checkIPBan(ws._socket.remoteAddress)) this.players[id].send(this.players[id].close(`Your IP ${ws._socket.remoteAddress} is banned.`));
		if (this.config.maxPerIP !== -1 && this.checkIPLimit(ws._socket.remoteAddress) > this.config.maxPerIP)
			this.players[id].send(this.players[id].close(`IP Connection Limit Reached.`));
	}

	/** @param {Player} player */
	removePlayer(player) {
		delete this.players[player];
	}

	/** @param {string} message */
	emitMessage(message) {
		return JSON.stringify({ type: 'emitMsg', text: message });
	}

	/** @param {string} message */
	serverMessage(message) {
		return JSON.stringify({ type: 'chatMsg', text: message, sender: 'Server', isServer: true });
	}

	/** @param {string} message */
	serverEval(message) {
		return JSON.stringify({ type: 'eval', text: message });
	}

	/** @param {string} message */
	serverError(message) {
		return JSON.stringify({ type: 'error', text: message });
	}

	/**
	 * @param {string} message
	 * @param {string} name
	 * @param {boolean} isAdmin
	 * @param {boolean} isMod
	 */
	playerMessage(message, name, isAdmin, isMod, room) {
		return JSON.stringify({ type: 'chatMsg', text: message, sender: name, admin: isAdmin, mod: isMod, room });
	}

	/** @param {*} string */
	broadCast(string) {
		for (let i in this.players) {
			const room = this.players[i].info.room;
			if (room === JSON.parse(string).room) this.players[i].send(string);
		}
	}

	/**
	 *
	 * @param {string} remoteAddress
	 */
	checkIPLimit(remoteAddress) {
		let connectionsOnIP = 0;
		for (const player in this.players) {
			const ws = this.players[player].ip;
			if (!ws) continue;
			if (ws === remoteAddress) connectionsOnIP++;
		}
		return connectionsOnIP;
	}
}

class Player {
	constructor(server, ws, id) {
		this.server = server;
		this.ws = ws;

		this.info = { name: '', room: this.server.rooms.public[0], id: id, isConnected: false, isAdmin: false, isMod: false, lastMessage: 0, lastRoomChange: 0 };
		this.ip = ws._socket.remoteAddress;

		this.updateInterval = setInterval(this.updateUsers.bind(this));
		this.updateRooms();

		this.send(Server.serverMessage('NodeJS WebSocket Chat Example'));
	}

	/** @param {string | Buffer} data */
	onMessage(data) {
		data = JSON.parse(data);

		const command = this.server.entities.get(data.type);

		if (!this.info.isConnected && !command) {
			console.log(`Disconnected User trying to send invalid data -> ${data.type} || ${JSON.stringify(data)}`);
			this.close(`Sending invalid data`);
			return;
		}

		if (command) command.run(data, this.server, this);
		else {
			console.log(`${this.info.name} trying to send invalid data type -> ${data.type} || ${JSON.stringify(data)}`);
			this.close(`Sending invalid data`);
		}
	}

	/** @param {string | Buffer} data */
	send(data) {
		if (this.ws.readyState == WebSocket.OPEN) this.ws.send(data);
	}

	/** @param {*} string */
	close(reason) {
		if (reason) this.send(this.server.serverError(`Connection Closed: ${reason}`));
		if (this.ws.readyState == WebSocket.OPEN) this.ws.close();
	}

	updateUsers() {
		let data = {};
		let player;
		data.type = 'update';
		data.players = {};
		for (const id in this.server.players) {
			player = this.server.players[id].info;
			if (!player.isConnected || player.room !== this.info.room) continue;
			if (this.server.players[id].info.id != this.info.id) player.isMe = false;
			else player.isMe = true;
			data.players[id] = player;
		}
		this.send(JSON.stringify(data));
	}

	updateRooms() {
		let data = {};
		let room;
		data.type = 'roomUpdate';
		if ((this.info.isConnected && this.info.isAdmin) || (this.info.isConnected && this.info.isMod)) {
			for (const i in this.server.rooms.admin) {
				room = this.server.rooms.admin[i];
				data.room = room;
				this.send(JSON.stringify(data));
			}
		} else {
			for (const i in this.server.rooms.public) {
				room = this.server.rooms.public[i];
				data.room = room;
				this.send(JSON.stringify(data));
			}
		}
	}
}

Server = new Server();
Server.startServer();
