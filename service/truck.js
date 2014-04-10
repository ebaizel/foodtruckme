var ObjectId = require('mongoose').Types.ObjectId;
var request = require('request');
var async = require('async');
var socratatoken = require('../creds').socratatoken;

exports.getTrucks = function(req, cb) {

	var conditions = {};
	var limit;
	var pageStart;

	for (var key in req.query) {

		if (key === 'lon' || key === 'lat' || key === 'distance' || key === 'address') {
			continue;
		} else if (key == "limit") {
			limit = req.query[key];
		} else if (key == "pageStart") {
			pageStart = req.query[key];			
		} else {
			if (req.query.hasOwnProperty(key)) {
				conditions[key] = new RegExp('^' + req.query[key] + '$', 'i');
			}
		}
	}

	// Handle location search
	if (req.query && req.query.hasOwnProperty('lon') && req.query.hasOwnProperty('lat')) {
		var distance = (req.query.distance ? req.query.distance : 5); // default 5 mile radius search
		conditions['loc'] = {
			$near:[req.query.lon, req.query.lat],
			$maxDistance: distance / 69
		};
	}

	if (req.query && req.query.address) {
		geoCodeAddress(req.query.address, function(latlon) {
			var distance = (req.query.distance ? req.query.distance : 5); // default 5 mile radius search		
			conditions['loc'] = {
				$near:[latlon.lon, latlon.lat],
				$maxDistance: distance / 69
			};
		})
	}

	async.parallel({
		getTrucks: function(pcb) {
			Truck.find(conditions).skip(pageStart * limit).limit(limit).exec(function(err, trucks) {
				pcb(err, trucks);
			});
		},
		countTrucks: function(pcb) {
			Truck.find(conditions).limit(1000).exec(function(err, trucks) {
				pcb(err, trucks.length);
			}); // can't use Mongoose count because it maxes at 100
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

var geoCodeAddress = function(address, cb) {
	
	//TODO: geoCode the address into a lat/lon
	var latlon = {
		lon: -122.4167,
		lat: 37.7833
	};
	cb(latlon);
}

var loadDataFromJSON = function(data, cb) {

	if (!data) {
		cb();
	}

	var truckArray = new Array();

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