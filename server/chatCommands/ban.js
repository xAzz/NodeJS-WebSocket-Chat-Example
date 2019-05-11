module.exports.run = (message, server, player) => {
	const ip = message.split(' ')[1];
	const ipBin = ip.split('.');

	if (ipBin.length !== 4) return player.send(server.serverMessage(`Invalid IP format: ${ip}`));
	if (ipBin[0] === '127') return player.send(server.serverMessage('Cannot ban localhost'));
	if (server.ipBanList.indexOf(ip) >= 0) return player.send(server.serverMessage(`${ip} is already in the ban list!`));

	server.ipBanList.push(ip);
	server.saveIpBanList();

	if (ipBin[2] === '*' || ipBin[3] === '*') {
		player.send(server.serverMessage(`The IP sub-net ${ip} has been banned`));
	} else {
		player.send(server.serverMessage(`The IP ${ip} has been banned`));
	}

	/* Once impletement ban ip user by name */
	// if (!player.info.isConnected || !server.checkIpBan(player.ip)) return;
	// player.send(server.serverMessage(`Banned: ${player.name} with ID ${player.id}`));
	// player.close('You have been banned from the server');
	// server.broadCast(server.emitMessage(`Banned ${name} from the server`));
};

module.exports.help = {
	name: 'ban',
	description: 'Ban IP from the server',
	usage: 'ban <ip>',
	modCommand: true
};
