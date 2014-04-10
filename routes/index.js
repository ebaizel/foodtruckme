var trucksvc = require('../service/truck');

exports.index = function(req, res){
	res.render('index');
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