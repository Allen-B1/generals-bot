#!/usr/bin/env node
const gamelib = require("./game.js");
const io = require('socket.io-client');
const socket = io('http://botws.generals.io');
const getopt = require("posix-getopt");

socket.on("disconnect", function() {
	console.error("Disconnected");
	process.exit(1);
});

function join_game() {
	var gameId = null;
	var parser = new getopt.BasicParser('c:', process.argv);

	var option;
	while((option = parser.getopt()) != undefined) {
		switch(option.option) {
		case 'c':
			gameId = option.optarg;
			break;
		}
	}

	var userId = process.env.BOT_USER_ID;
	console.log("User id: " + userId);

	if(gameId === null) {
		socket.emit("play", userId);
		console.log("Joined FFA queue in https://bot.generals.io/");		
	} else {
		socket.emit("join_private", gameId, userId);
		// TODO: Add commands instead of this
		socket.emit("set_force_start", gameId, true);
		console.log("Joined http://bot.generals.io/games/" + encodeURI(gameId));
	}
}

socket.on("connect", function() {
	console.log("Connected");
	join_game();
});

var playerIndex = -1;
var chatroom = null;

var game = new gamelib.GameData();
socket.on("game_start", function(data) {
	playerIndex = data.playerIndex;
	chatroom = data.chat_room;
	var replay_url = 'http://bot.generals.io/replays/' + encodeURIComponent(data.replay_id);
	console.log('Game starting! Replay: ' + replay_url)
});

var times = 0; // number of times "hi" was said
socket.on("chat_message", function(chat_room, data) {
	if(data.playerIndex !== playerIndex && (data.text.toLowerCase() === "hi" || data.text.toLowerCase() === "hello")) {
		// if this is the first or second time
		if(times < 2) {
			socket.emit("chat_message", chat_room, (times === 0 ? "hi" : "hello"));
		}
		times++;
	}
});

socket.on("game_update", function(data) {
	game.feed_data(data);

	// Find all tiles that are ours that have more than one army
	var tiles = game.terrain.reduce((arr, tile_value, tile_index) => {
		if(tile_value === playerIndex && game.armies[tile_index] > 1)
			arr.push(tile_index);
		return arr;
	}, []);

	// Find all tiles that have an enemy next to them
	var tiles_w_enemy = tiles.filter((tile_index) => {
		for(adj_tile of [tile_index + 1, tile_index - 1, tile_index + game.width, tile_index - game.width]) {
			if(game.terrain[adj_tile] >= 0 && game.terrain[adj_tile] !== playerIndex) {
				return true;
			}
		}
	});

	/* Attack enemy if possible */
	while(true) {
		// If there are no tiles left break
		if(tiles_w_enemy.length === 0) break;

		// Pick a random tile.
		var index = Math.floor(Math.random() * tiles_w_enemy.length);
		var tile_index = tiles_w_enemy[index];
		// Remove tile from possible armies next time (so that the same tile isn't chosen every single time)
		tiles_w_enemy.splice(index, 1);

		// For each adjacent tile, attack if sufficient armies
		for(adj_tile of [tile_index + 1, tile_index - 1, tile_index + game.width, tile_index - game.width]) {
			if(game.terrain[adj_tile] >= 0 && game.terrain[adj_tile] !== playerIndex && game.armies[adj_tile] + 1 < game.armies[tile_index]) {
				socket.emit("attack", tile_index, adj_tile);
				return;
			}
		}
	}

	// Tiles with an adjacent empty tile
	var tiles_pool = tiles.slice();
	/* Attack empty tile if possible */
	while (true) {
		// If there are no more tiles to choose from then break
		if(tiles_pool.length === 0) break;

		// Pick a random tile.
		var index = Math.floor(Math.random() * tiles_pool.length);
		var tile_index = tiles_pool[index];
		// Remove tile from possible armies next time (so that the same tile isn't chosen every single time)
		tiles_pool.splice(index, 1);

		// If it has an empty tile next to it that has a nonpositive army (empty squares and cities/neutral squares with negative army), attack
		for(adj_tile of [tile_index + 1, tile_index - 1, tile_index + game.width, tile_index - game.width]) {
			if(game.terrain[adj_tile] === gamelib.Tile.EMPTY && (game.armies[adj_tile] <= 10 && game.armies[adj_tile] + 1 < game.armies[tile_index])) {
				socket.emit("attack", tile_index, adj_tile);
				return;
			}
		}
	}

	

	// Otherwise move a random army towards the general
	var tile_index = tiles[Math.floor(Math.random() * tiles.length)];
	var tile_col = tile_index % game.width;
	var tile_row = Math.floor(tile_index / game.width);
	var general = game.generals[playerIndex];
	var general_col = general % game.width;
	var general_row = Math.floor(general / game.width);
	socket.emit("attack", tile_index,
		// Is the difference in row or col greater?
		Math.abs(general_col - tile_col) > Math.abs(general_row - tile_row) ? 
		// If col, move left or right
		tile_index + Math.sign(general_col - tile_col):
		// If row, move up if general is higher or down is general is lower
		tile_index + Math.sign(general_row - tile_row) * game.width
	);
});

function leave_game() {	
	socket.emit("chat_message", chatroom, "gg");
	setTimeout(function() {
		socket.emit("leave_game");
		join_game();
	}, 2000);
}
socket.on("game_won", function() {
	console.log("Game won!");
	leave_game();
});

socket.on("game_lost", function() {
	console.log("Game lost. :(");
	leave_game();
});
