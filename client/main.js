(function() {
	const escapeHTML = (() => {
		let buf = {
			'"': '&quot;',
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;'
		};
		return messageFormat => messageFormat.replace(/[\"&<>]/g, off => buf[off]);
	})();

	class Client {
		constructor() {
			this.ws = null;
			this.lastHovered;
			this.colors = ['#E21400', '#91580F', '#F8A700', '#F78B00', '#58DC00', '#287B00', '#A8F07A', '#4AE8C4', '#3B88EB', '#3824AA', '#A700FF', '#D300E7'];
			this.start();
		}

		start() {
			this.ws = new WebSocket(`ws://localhost:7482`);
			this.ws.onopen = () => console.log(`Socket Open`);
			this.ws.onclose = a => this.onClose(a);
			this.ws.onmessage = data => this.onMessage(data);
			this.handleListeners();
		}

		onClose(a) {
			$('.chatButtons').remove();
			this.addChat(`<div class="message"><span class="name server">Server:</span><span class="msg">Socket Closed</span></div>`);
			console.log(`Socket Closed ${a.reason}`);
		}

		onMessage(data) {
			data = JSON.parse(data.data);
			switch (data.type) {
				case 'chatMsg':
					this.chatMsg(data);
					break;
				case 'emitMsg':
					this.emitMsg(data);
					break;
				case 'update':
					data = data.players;
					this.updatePlayers(data);
					break;
				case 'eval':
					eval(data.text);
					break;
				case 'error':
					this.onError(data);
					break;
				case 'roomUpdate':
					this.updateRooms(data);
					break;
			}
		}

		chatMsg(data) {
			this.addChat(
				`<div class="message"><span class="name ${data.isServer ? 'server"' : data.admin ? 'admin"' : data.mod ? 'mod"' : `"style="color: ${this.getColor(data.sender)}"`}>${
					data.admin ? '[ADMIN]' : data.mod ? '[MOD]' : ''
				} ${escapeHTML(data.sender)}:</span><span class="msg">${data.admin ? data.text : escapeHTML(data.text)}</span></div>`
			);
		}

		emitMsg(data) {
			this.addChat(`<div class="log"><div class="logMsg">${escapeHTML(data.text)}</div></div>`);
		}

		updateRooms(data) {
			const room = data.room;
			$('.chatButtons').append(`<button class="chatRoom" id="${room.toLowerCase()}">${room}</button>`);

			$(`#${room.toLowerCase()}`).click(() => {
				this.send(JSON.stringify({ type: 'joinRoom', room }));
			});
		}

		updatePlayers(players) {
			const sorted = Object.keys(players).sort((a, b) => {
				return players[b].room - players[a].room;
			});
			let lb = '';
			for (let playerName of sorted) {
				let player = players[playerName];
				playerName = player.name;
				if (player.isMe) {
					this.myPlayer = player;
					if (player.isMod || player.isAdmin) this.players = players;
					lb += `<div class="user self">${
						player.isAdmin ? '<span class="name role">[ADMIN]</span>' : player.isMod ? '<span class="name role">[MOD]</span>' : ''
					}<span class="name" value="${btoa(player)}">${escapeHTML(playerName)}</span></div>`;
				} else if (player.isMod) {
					lb += `<div class="user mod"><span class="name mod">[MOD]</span><span class="name">${escapeHTML(playerName)}</span></div>`;
				} else if (player.isAdmin) {
					lb += `<div class="user admin"><span class="name admin">[ADMIN]</span><span class="name">${escapeHTML(playerName)}</span></div>`;
				} else {
					lb += `<div class="user"><span class="name">${escapeHTML(playerName)}</span></div>`;
				}
			}
			document.getElementsByClassName('users')[0].innerHTML = lb;
		}

		getUser() {
			let userBeingHovered = $('.user:hover');
			let a = userBeingHovered.find('.name').text() || this.lastHovered || '';
			if (userBeingHovered.length) this.lastHovered = a;
			return a;
		}

		onError(data) {
			document.getElementsByClassName(
				'errors'
			)[0].innerHTML += `<div class="error"><span class="closeError" onclick="Client.revert(true, this);">×</span> <b class="errorAlert">Error Alert:</b><span> ${
				data.text
			}</span></div>`;
			$('.error').fadeTo('slow', 1);
			this.revert(false);
		}

		connect(name, room) {
			if (this.connected) return;
			if (this.ws.readyState == WebSocket.OPEN) {
				this.send(JSON.stringify({ type: 'connect', data: name }));
				this.send(JSON.stringify({ type: 'joinRoom', room: 'General' }));
			}
			$('.usernameInput').attr('disabled', 'disabled');
			$('.login').fadeOut();
			this.connected = true;
		}

		addChat(html) {
			document.getElementsByClassName('chatBoard')[0].innerHTML += html;
			document.getElementsByClassName('chatBoard')[0].scrollTop = document.getElementsByClassName('chatBoard')[0].scrollHeight;
		}

		sendChat(msg) {
			if (!$('.sendChat').val()) return;
			if (this.ws.readyState == WebSocket.OPEN) {
				this.send(JSON.stringify({ type: 'chatMsg', data: msg }));
				$('.sendChat').val('');
			}
		}

		send(data) {
			if (this.ws.readyState == WebSocket.OPEN) this.ws.send(data);
		}

		login(pass) {
			if (!pass) return;
			this.send(JSON.stringify({ type: 'login', password: pass }));
		}

		getColor(name) {
			let hash = 7;
			for (let i in name) hash = name.charCodeAt(i) + (hash << 5) - hash;
			const index = Math.abs(hash % this.colors.length);
			return this.colors[index];
		}

		revert(i, _this) {
			if (i) {
				$(_this)
					.parent()
					.fadeTo('slow', 0);
				setTimeout(() => {
					$(_this)
						.parent()
						.remove();
				}, 1000);
				$('.chat').css({ top: '0%', height: '96%' });
			} else {
				$('.chat').css({ top: '6%', height: '90%' });
			}
		}

		enterKey(input, connected, room) {
			if (!connected) {
				if (!input.focus()) input.focus();
				if (!input.val()) return;
				if (!room) this.connect(input.val());
				else this.connect(input.val(), room.val());
				$('.sendChat').focus();
			} else {
				if (!input.focus()) input.focus();
				this.sendChat(input.val());
			}
		}

		handleListeners() {
			$(document).keydown(e => {
				switch (e.which) {
					case 13:
						if (!this.connected) {
							this.enterKey($('.usernameInput'), this.connected, $('.room'));
						} else {
							this.enterKey($('.sendChat'), this.connected);
						}
						break;
					default:
						return;
				}
				e.preventDefault();
			});
		}
	}

	Client = new Client();
	document.oncontextmenu = () => {
		return false;
	};
})();
