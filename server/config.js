module.exports = {
	port: 7482,
	maxPerIP: 2,
	/* Rooms */
	rooms: {
		public: ['English Lobby', 'International Lobby'], // Public Rooms
		admin: ['Staff'] // Admin/Mod Rooms
	},
	/* Passwrds */
	passwords: {
		admin: ['password1', 'password2'], // Admin Passwords
		mod: ['password3', 'password4'] // Mod Passwords
	}
};
