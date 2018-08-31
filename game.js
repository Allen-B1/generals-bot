class GameData {
	constructor() {
		this.map = []
		this.cities = []
		this.generals = []
		this.scores = []
	}
	/** Feeds data.generals to the game */
	feed_generals_data(generals) {
		this.generals = generals.map((general, playerIndex) => {
			// if general in new generals array, return that
			if(general !== -1)
				return general;
			// otherwise return this.generals[index], which might contain 
			else
				return this.generals[playerIndex];
		});
	}
	/** Feeds data.map_diff to the game */
	feed_map_data(map_diff) {
		this.map = GameData.patch(this.map, map_diff)
	}
	/** Feeds data.cities_diff to the game */
	feed_cities_data(cities_diff) {
		this.cities = GameData.patch(this.cities, cities_diff)
	}
	/** Convenience function. Calls

	> this.feed_generals_data(data.generals)
	> this.feed_map_data(data.map_diff)
	> this.feed_cities_data(data.cities_diff)

	*/
	feed_data(data) {
		this.feed_generals_data(data.generals);
		this.feed_map_data(data.map_diff);
		this.feed_cities_data(data.cities_diff);
		this.scores = data.scores;
	}

	/** Patching function. Taken from http://dev.generals.io/api#tutorial */
	static patch(old, diff) {
		var out = [];
		var i = 0;
		while (i < diff.length) {
			if (diff[i]) {  // matching
				Array.prototype.push.apply(out, old.slice(out.length, out.length + diff[i]));
			}
			i++;
			if (i < diff.length && diff[i]) {  // mismatching
				Array.prototype.push.apply(out, diff.slice(i + 1, i + 1 + diff[i]));
				i += diff[i];
			}
			i++;
		}
		return out;
	}

	get width() {
		return this.map[0];
	}

	get height() {
		return this.map[1];
	}

	get size() {
		return this.width * this.height;
	}

	get armies() {
		return this.map.slice(2, this.size + 2);
	}

	get terrain() {
		return this.map.slice(this.size + 2, this.size + this.size + 2)
	}
}

module.exports.GameData = GameData;
module.exports.Tile = {
	EMPTY: -1,
	MOUNTAIN: -2,
	FOG: -3,
	FOG_OBSTACLE: -4
};
