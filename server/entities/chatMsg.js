module.exports.run = (data, server, player) => {
	if (!player.info.isConnected) return;
	let message = data.data;
	if (!message) return;

	if (!message.replace(/ /g, '').length) return;
	if (message.replace(/ /g, '').length < 2 || message.length > 200) return player.send(server.serverMessage('Please only send between 2-200 characters!'));

	if (Date.now() - player.info.lastMessage > 1500) {
		if (message[0] == '/') {
			message = message.slice(1);

			const command = server.commands.get(message.split(' ')[0]);

			if (command) command.run(message, server, player);
			else player.send(server.serverMessage(`Invalid Command!`));
		} else {
			server.broadCast(server.playerMessage(message, player.info.name, player.info.isAdmin, player.info.isMod, player.info.room));
			player.info.lastMessage = Date.now();
		}
	} else {
		player.send(server.serverMessage('Please wait 1.5 seconds till you can use chat again'));
	}
};
