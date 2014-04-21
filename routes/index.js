var trucksvc = require('../service/truck');

exports.index = function(req, res){
	res.render('home');
};

exports.getTrucks = function(req, res) {
	trucksvc.getTrucks(req, function(err, trucks) {
		if (err) { 
			res.json (500, {
				status: "error"
			});
		} else {
			res.json(200, {
				status: "success",
				count: trucks.count,
				results: trucks.results
			});
		}
	});
}

exports.geoCodeAddress = function(req, res) {
	trucksvc.geoCodeAddress(req, function(err, geo) {
		if (err) {
			res.json(500, {
				status: "error",
				message: err.message
			});
		} else {
			res.json(200, {
				status: "success",
				lat: geo.lat,
				lon: geo.lon
			});
		}
	})
}