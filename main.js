#!/usr/bin/env node
const GameData = require("./game.js");
const io = require('socket.io-client');
const socket = io('http://botws.generals.io');

var game = new GameData();
socket.on("disconnect", function() {
	console.error("Disconnected");
	process.exit(1);
});
socket.on("connect", function() {
	console.log("Connected");
	var user_id = process.env.BOT_USER_ID;
	var game_id = "test_2"
	console.log("User id: " + user_id);
	socket.emit("join_private", game_id, user_id);
	socket.emit("set_force_start", game_id, true);
	console.log("Joined http://bot.generals.io/games/" + encodeURI(game_id));
	
});
var playerIndex = -1;
var chatroom = null;
socket.on("game_start", function(data) {
	playerIndex = data.playerIndex;
	chatroom = data.chat_room;
	var replay_url = 'http://bot.generals.io/replays/' + encodeURIComponent(data.replay_id);
	console.log('Game starting! Replay: ' + replay_url)
});

socket.on("game_update", function(data) {
	game.feed_data(data);

	while (true) {
		// Pick a random tile.
		var index = Math.floor(Math.random() * game.size);

		// If we own this tile, make a random move starting from it.
		if (game.terrain[index] === playerIndex) {
			var row = Math.floor(index / game.width);
			var col = index % game.width;
			var endIndex = index;

			var rand = Math.random();
			if (rand < 0.25 && col > 0) { // left
				endIndex--;
			} else if (rand < 0.5 && col < game.width - 1) { // right
				endIndex++;
			} else if (rand < 0.75 && row < game.height - 1) { // down
				endIndex += game.width;
			} else if (row > 0) { //up
				endIndex -= game.width;
			} else {
				continue;
			}

			// Would we be attacking a city? Don't attack cities.
			if (game.cities.indexOf(endIndex) >= 0) {
				continue;
			}

			socket.emit('attack', index, endIndex);
			break;
		}
	}
});

function leave_game() {	
	socket.emit("chat_message", chatroom, "gg");
	setTimeout(function() {
		socket.emit("leave_game");
	}, 1000);
}
socket.on("game_won", function() {
	leave_game();
});

socket.on("game_lost", function() {
	leave_game();
});
