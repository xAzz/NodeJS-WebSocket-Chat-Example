module.exports.run = (data, server, player) => {
	if (!player.info.isConnected) return;
	let room = data.room;

	if (room === player.info.room) return;

	if (Date.now() - player.info.lastRoomChange > 1500) {
		if (!room) return (player.info.room = 'Lobby'), player.send(server.serverMessage(`Now talking in ${player.info.room}`));

		for (let i in server.rooms.public) {
			if (room === server.rooms.public[i]) {
				player.info.room = server.rooms.public[i];
				player.send(server.serverMessage(`Now talking in ${room}`));
				player.info.lastRoomChange = Date.now();
			}
		}

		if (player.info.isAdmin || player.info.isMod) {
			for (let i in server.rooms.admin) {
				if (room === server.rooms.admin[i]) {
					player.info.room = server.rooms.admin[i];
					player.send(server.serverMessage(`Now talking in ${room}`));
					player.info.lastRoomChange = Date.now();
				}
			}
		}
	} else {
		player.send(server.serverMessage(`Please wait another 1.5 seconds before you can change rooms again!`));
	}
};
