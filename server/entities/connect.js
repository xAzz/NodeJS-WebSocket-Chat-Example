module.exports.run = (data, server, player) => {
	if (player.info.isConnected) return;
	const length = 15;
	let name = data.data;
	if (name.indexOf(String.fromCharCode(8238)) != -1) player.close();

	for (const i in server.players) if (name == server.players[i].name) player.send(server.serverError('Name Taken! Please choose a different name!'));
	if (!name || name.replace(/ /g, '').length < 1) name = 'Unknown';

	if (name.length > length) name = name.substring(0, length);

	player.info.name = name;
	player.info.isConnected = true;
	server.broadCast(server.emitMessage(`${player.info.name} joined`));

	// IP Limit Check - Limit to 1 IP Per User
	/*for (const i in server.players) {
		if (server.players[i].info.isConnected && server.players[i] != server.players[player.info.id] && player.ip == server.players[i].ip) {
			server.broadCast(server.emitMessage(`${player.info.name} kicked from the chat`));
			player.close(`You are already connected to the chat as ${server.players[i].info.name || 'Unknown'}`);
			return;
		}
	}*/

	// IP Limit Check - Limit to * IP Per User
	/*if (server.checkIPLimit(player.ip) > server.config.maxPerIP) {
		server.broadCast(server.emitMessage(`${player.info.name} kicked from the chat`));
		player.close('IP limit reached.');
		console.log(`Player tried to connect from IP ${player.ip}, but is past the IP limit.`);
		return;
	}*/
};
