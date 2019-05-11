module.exports.run = (message, server, player) => {
	fs.readdir('./chatCommands/', (err, files) => {
		if (err) return console.error(err);

		const jsFile = {};

		files.forEach(file => {
			let name = file.split('.js')[0];
			let description = server.commands.get(name).help.description || 'No Description Provided';
			let usage = server.commands.get(name).help.usage || 'No Usage Provided';
			let modCommand = server.commands.get(name).help.modCommand;
			jsFile[Object.entries(jsFile).length] = [`/${usage} - ${description}`, modCommand];
		});

		for (const i in jsFile) {
			if ((player.info.isMod && jsFile[i][1]) || (player.info.isAdmin && jsFile[i][1])) player.send(server.serverMessage(jsFile[i][0]));
			else if ((!player.info.isMod && !jsFile[i][1]) || (!player.info.isAdmin && !jsFile[i][1])) player.send(server.serverMessage(jsFile[i][0]));
		}
	});
};

module.exports.help = {
	name: 'help',
	description: '',
	usage: 'help',
	modCommand: false
};
