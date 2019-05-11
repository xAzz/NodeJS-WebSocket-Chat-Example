module.exports.run = (message, server, player) => {
	const ip = message.split(' ')[1];
	const index = server.ipBanList.indexOf(ip);
	if (index < 0) return player.send(server.serverMessage(`IP ${ip} is not in the ban list!`));
	server.ipBanList.splice(index, 1);
	player.send(server.serverMessage(`Unbanned IP: ${ip}`));
	server.saveIpBanList();
};

module.exports.help = {
	name: 'unban',
	description: 'Unban IP from the server',
	usage: 'unban <ip>',
	modCommand: true
};
