#!/usr/bin/env node
const gamelib = require("./game.js");
const io = require('socket.io-client');
const socket = io('http://botws.generals.io');

var game = new gamelib.GameData();
socket.on("disconnect", function() {
	console.error("Disconnected");
	process.exit(1);
});

function join_game(user_id) {
	var game_id = "test";
	var user_id = process.env.BOT_USER_ID;
	console.log("User id: " + user_id);
	socket.emit("join_private", game_id, user_id);

	// TODO: Add commands instead of this
	socket.emit("set_force_start", game_id, true);
	console.log("Joined http://bot.generals.io/games/" + encodeURI(game_id));
}

socket.on("connect", function() {
	console.log("Connected");
	join_game();
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
	console.log("Update!");

	// Find all tiles that are ours that have more than one army
	var tiles = game.terrain.reduce((arr, tile_value, tile_index) => {
		if(tile_value === playerIndex && game.armies[tile_index] > 1)
			arr.push(tile_index);
		return arr;
	}, []);

	// Tiles with an adjacent empty tile
	var tiles_pool = tiles.slice();
	// Find a tile with an adjacent empty tile
	while (true) {
		// If there are no more tiles to choose from then finish turn
		if(tiles_pool.length === 0) 
			break;

		// Pick a random tile.
		var index = Math.floor(Math.random() * tiles_pool.length);
		var tile_index = tiles_pool[index];
		// Remove tile from possible armies next time (so that the same tile isn't chosen every single time)
		tiles_pool.splice(index, 1);

		// TODO: Check for cities
		// If it has an empty tile next to it, attack
		if(game.terrain[tile_index + 1] === gamelib.Tile.EMPTY) {
			socket.emit("attack", tile_index, tile_index + 1);
			return;
		} else if(game.terrain[tile_index - 1] === gamelib.Tile.EMPTY) {
			socket.emit("attack", tile_index, tile_index - 1);
			return;
		} else if(game.terrain[tile_index + game.width] === gamelib.Tile.EMPTY) {
			socket.emit("attack", tile_index, tile_index + game.width);
			return;
		} else if(game.terrain[tile_index - game.width] === gamelib.Tile.EMPTY) {
			socket.emit("attack", tile_index, tile_index - game.width);
			return;
		}
	}

	console.log("No tiles left");

	// Otherwise move a random army
	var tile_index = tiles[Math.floor(Math.random() * tiles.length)];

	// Pick a random direction
	var direction = Math.floor(Math.random() * 4);

	switch(direction) {
	case 1:
		if(game.terrain[tile_index + 1] === playerIndex) {
			socket.emit("attack", tile_index, tile_index + 1);				
			break;
		}
	case 2:
		if(game.terrain[tile_index - 1] === playerIndex) {
			socket.emit("attack", tile_index, tile_index - 1);
			break;
		}
	case 3:
		if(game.terrain[tile_index + game.width] === playerIndex) {
			socket.emit("attack", tile_index, tile_index + game.width);
			break;
		}
	default:
		if(game.terrain[tile_index - game.width] === playerIndex) {
			socket.emit("attack", tile_index, tile_index - game.width);
		}
	}
});

function leave_game() {	
	socket.emit("chat_message", chatroom, "gg");
	setTimeout(function() {
		socket.emit("leave_game");
		setTimeout(function() {
			join_game();
		}, 5000);
	}, 1000);
}
socket.on("game_won", function() {
	leave_game();
});

socket.on("game_lost", function() {
	leave_game();
});
