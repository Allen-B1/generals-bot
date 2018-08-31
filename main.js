#!/usr/bin/env node
const GameData = require("./game.js");
const io = require('socket.io-client');
const socket = io('http://botws.generals.io');

var gameData = new GameData();
socket.on("disconnect", function() {
	console.error("Disconnected");
	process.exit(1);
});
socket.on("connect", function() {
	console.log("Connected");
	var user_id = process.env.BOT_USER_ID;
	socket.emit("join_private", "test", user_id);
	socket.emit("set_force_start", "test", true);
	console.log("Joined http://bot.generals.io/games/test");
	
});
var playerIndex = -1;
socket.on("game_start", function(data) {
	playerIndex = data.playerIndex;
	var replay_url = 'http://bot.generals.io/replays/' + encodeURIComponent(data.replay_id);
	console.log('Game starting! Replay: ' + replay_url)
});

socket.on("game_update", function(data) {
	gameData.feed_data(data);

	while (true) {
		// Pick a random tile.
		var index = Math.floor(Math.random() * size);

		// If we own this tile, make a random move starting from it.
		if (terrain[index] === playerIndex) {
			var row = Math.floor(index / width);
			var col = index % width;
			var endIndex = index;

			var rand = Math.random();
			if (rand < 0.25 && col > 0) { // left
				endIndex--;
			} else if (rand < 0.5 && col < width - 1) { // right
				endIndex++;
			} else if (rand < 0.75 && row < height - 1) { // down
				endIndex += width;
			} else if (row > 0) { //up
				endIndex -= width;
			} else {
				continue;
			}

			// Would we be attacking a city? Don't attack cities.
			if (cities.indexOf(endIndex) >= 0) {
				continue;
			}

			socket.emit('attack', index, endIndex);
			break;
		}
	}
});
