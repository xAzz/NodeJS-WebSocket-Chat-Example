module.exports.run = (message, server, player) => {
	message = message.split(' ')[1];
	if (!message) return player.send(server.serverMessage(`Please provide a valid password!`));
	if (player.info.isAdmin) return player.send(server.serverMessage('You have already logged in as a Admin!'));
	if (player.info.isMod) return player.send(server.serverMessage('You have already logged in as a Moderator!'));

	if (server.passwords.admin.indexOf(message) >= 0) {
		player.info.isAdmin = true;
		console.log(`${player.info.name} logged in as Admin`);
		player.send(server.serverMessage('You have logged in as Admin'));
		server.broadCast(server.emitMessage(`${player.info.name} logged in as Admin`));
		player.updateRooms();
	} else if (server.passwords.mod.indexOf(message) >= 0) {
		player.info.isMod = true;
		console.log(`${player.info.name} logged in as Moderator`);
		player.send(server.serverMessage('You have logged in as Moderator'));
		server.broadCast(server.emitMessage(`${player.info.name} logged in as Moderator`));
		player.updateRooms();
	} else {
		return player.send(server.serverMessage('Incorrect Password!'));
	}
};

module.exports.help = {
	name: 'login',
	description: 'Login as Moderator or Admin',
	usage: 'login <password>',
	modCommand: false
};
