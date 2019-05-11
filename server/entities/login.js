module.exports.run = (data, server, player) => {
	if (player.info.isConnected || !data.password) return;
	if (player.info.isAdmin) return server.send(server.serverMessage('You have already logged in as a Admin!'));
	if (player.info.isMod) return server.send(server.serverMessage('You have already logged in as a Moderator!'));
	if (passwords.admin.includes(data.password)) {
		player.info.isAdmin = true;
		console.log(`${player.info.name} logged in as Admin`);
		server.send(server.serverMessage('You have logged in as Admin'));
		server.broadCast(emitMessage(`${player.info.name} logged in as Admin`));
	} else if (passwords.mod.includes(data.password)) {
		player.info.isMod = true;
		console.log(`${player.info.name} logged in as Moderator`);
		server.send(server.serverMessage('You have logged in as Moderator'));
		server.broadCast(emitMessage(`${player.info.name} logged in as Moderator`));
	} else {
		return server.send(server.serverMessage('Incorrect Password!'));
	}
};
