var ObjectId = require('mongoose').Types.ObjectId;
var request = require('request');
var async = require('async');

// Service tier for getting food trucks
// All query parameters are optional; returns all trucks if no query params
//		name - name of the food truck, e.g. name=Curry%20Up%20Now
//		status - APPROVED or EXPIRED or PENDING, e.g. status=APPROVED
// 		limit - number of results to return, e.g. limit=20
//		pageStart - for pagination, e.g. pageStart=0
//		nelon, nelat, swlon, swlat - for location based search; all must be specified
exports.getTrucks = function(req, cb) {

	var conditions = {};
	var limit;
	var pageStart;

	if (req.query) {
		if (req.query.limit) {
			limit = req.query.limit;
		}
		if (req.query.pageStart) {
			pageStart = req.query.pageStart;
		}
		if (req.query.status) {
			conditions['status'] = new RegExp('^' + req.query.status + '$', 'i');
		}
		if (req.query.name) {
			conditions['name'] = new RegExp('^' + req.query.name + '$', 'i');
		}
		if (req.query.nelon && req.query.nelat && req.query.swlon && req.query.swlat) {
			conditions['loc'] = {
				$geoWithin: {
					$box: [[parseFloat(req.query.swlon), parseFloat(req.query.swlat)],
						[parseFloat(req.query.nelon), parseFloat(req.query.nelat)]]
				}
			};
		}
	}

	async.parallel({
		getTrucks: function(pcb) {
			Truck.find(conditions).skip(pageStart * limit).limit(limit).exec(function(err, trucks) {
				pcb(err, trucks);
			});
		},
		countTrucks: function(pcb) {
			Truck.count(conditions).exec(function(err, trucks) {
				pcb(err, trucks);
			});
		}
	}, function(err, results) {
		if (err) {
			cb(err);
		} else {
			var result = {};
			result.results = results.getTrucks;
			result.count = results.countTrucks;
			cb(null, result);
		}
	});
}

// Fetches data from sfgov and refreshes the database
exports.refreshTruckData = function(cb) {

	request('http://data.sfgov.org/resource/rqzj-sfat.json?$$app_token=' + socratatoken, function(error, response, body) {
		if (!error && response.statusCode == 200) {		

			var results = JSON.parse(body);

			Truck.remove({}, function(err) {
				if (err) {
					cb(err);
				} else {
					loadDataFromJSON(results, function(err) {
						console.log('Data refreshed at ' + new Date());
						cb(err);
					});
				}
			});

		} else {
			console.log('Error refreshing truck data. SFGov response was: ' + response.statusCode);
			console.log(error);
			cb(error);			
		}
	});
}

// Geocodes an address
// Send in the address as an encoded address string
// e.g. address=123%20Main%20Street
exports.geoCodeAddress = function(req, cb) {

	if (req.query.address) {
		request('https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=' + req.query.address, 
			function(error, response, body) {
			
			if (!error && response.statusCode == 200) {
				var results = JSON.parse(body);
				if (results.status != "OK") {
					cb(new Error('Could not resolve address'), null);
				} else {
					var geometry = results.results[0].geometry;
					var latlon = {
						lon: geometry.location.lng,
						lat: geometry.location.lat
					};

					cb(null, latlon);
				}
			} else {
				cb(error, null);
			}
		});
	} else {
		cb(new Error('Missing address'), null);
	}
}

var loadDataFromJSON = function(data, cb) {

	if (!data) {
		cb();
	}

	var truckArray = new Array();

	try {
		for (var i=0; i < data.length; i++) {
			var truck = data[i];
			
			var truckdata = {
				srcid: truck.objectid,
				loc: {
					lon: truck.longitude,
					lat: truck.latitude
				},
				desc: truck.fooditems,
				status: truck.status,
				name: truck.applicant,
				address: truck.address,
				created: new Date()
			}

			if (cleanAndValidateTruckData(truckdata)) {
				truckArray.push(truckdata);
			}
		}

		async.each(truckArray, insertTruck, function(err) {
			if (err) {
				console.log('Error loading data. ', err);
			}
			cb(err);
		});
	} catch (e) {
		// Response was invalid; just continue
		console.log('Exception happened parsing JSON response.', e);
		cb(new Error('Exception parsing JSON response.'));
	}
}

var cleanAndValidateTruckData = function(data) {
	if (!data.desc) data.desc = "";
	return (data.loc.lon && data.loc.lat && data.status && data.name && data.address);
}

var insertTruck = function(truckdata, cb) {
	var newTruck = new Truck(truckdata);
	Truck.update({objectid: truckdata.srcid}, truckdata, {upsert: true}, function(err, truck) {
		if (err) {
			console.log('Error loading truck ', newTruck);
		}
		cb(err, truck);		
	})
}

exports.loadDataFromJSON = loadDataFromJSON;