class Game {
	constructor() {
		this.map = []
		this.cities = []
		this.generals = []
	}
	feed_generals_data(generals) {
		
	}
	feed_map_data(map_diff) {
		this.map = Game.patch(this.map, map_diff)
	}
	feed_cities_data(cities_diff) {
		this.cities = Game.patch(this.cities, cities_diff)
	}
	
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
}
