var chai = require("chai");
var expect = chai.expect;
var models = require('../models');
var mongoose = require('mongoose');
var testdata = require('../foodtrucks.json');
var async = require('async');

var db = mongoose.createConnection('localhost/foodtrucktest');
db.on('error', console.error.bind(console, 'connection error:'));
global.Truck = db.model('Truck', models.truckSchema);

var trucksvc = require('../service/truck');

describe('Truck', function() {

	/**
	 *  Setup
	 */

	before(function(done) {
		// Clear out the Truck collection, and seed a new one
		Truck.remove({}, function(err) {
			trucksvc.loadDataFromJSON(testdata, done);
		});
	});

	after(function(done) {
		Truck.remove({}, function(err) {
			done();
		});
	});

	/**
	 *  Tests
	 */

	describe('#getTrucks', function() {

		it('should get a truck by its name', function(done) {
			var req = {};
			req.query = {
				name: 'Curry Up Now'
			};
			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length(2);
				expect(trucks.count).to.equals(2);
				done();
			});
		});

		it('should get no trucks if name does not exist', function(done) {
			var req = {};
			req.query = {
				name: 'EmileBaizelFoodTruck'
			};
			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length(0);
				expect(trucks.count).to.equals(0);
				done();
			});
		});

		it('should get only active permits', function(done) {
			var req = {};
			req.query = {
				status: 'APPROVED'
			};
			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length(301);
				expect(trucks.count).to.equals(301);				
				done();
			});
		});

		it('should get only expired permits', function(done) {
			var req = {};
			req.query = {
				status: 'EXPIRED'
			};
			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length(187);
				expect(trucks.count).to.equals(187);
				done();
			});
		});

		it('should observe limits on number of trucks returned', function(done) {
			var req = {};
			req.query = {
				limit: 25
			};
			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length(25);
				expect(trucks.count).to.equals(564);
				done();
			})
		})

		it('should get all trucks when no filters set', function(done) {
			var req = {};
			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length(564);
				expect(trucks.count).to.equals(564);				
				done();
			});
		});

		it('should paginate', function(done) {
			async.parallel({
					pageOne: function(cb) {
						var req = {};
						req.query = {
							limit: 25
						}
						trucksvc.getTrucks(req, cb);
					},
					pageTwo: function(cb) {
						var req = {};
						req.query = {
							limit: 25,
							pageStart: 1
						}
						trucksvc.getTrucks(req, cb);						
					}
				}, function(err, results) {
					expect(results.pageOne.results[0].srcid).not.to.equal(results.pageTwo.results[0].srcid);
					expect(results.pageOne.count).to.equals(564);
					expect(results.pageTwo.count).to.equals(564);					
					done();
				});
		});
	});
	describe('#spatial queries', function() {

		it('should find trucks within a search radius', function(done) {
			var req = {};
			req.query = {
				lon: -122.489324, // Outer Sunset; only one food truck permit here
				lat: 37.783702,
				distance : .1
			};

			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length(1);
				expect(trucks.results[0]['name']).to.equal('Eva\'s Catering');
				done();
			});
		});

		it('should not find any trucks near Moscow', function(done) {
			var req = {};
			req.query = {
				lon : 37.6173, // Moscow, Russia
				lat : 55.755826,
				distance : 5
			};
			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length(0);
				done();
			});
		});

		it('should search by address', function(done) {
			var req = {};
			req.query = {
				address: '2000 Broadway, San Francisco, CA'
			};

			trucksvc.getTrucks(req, function(err, trucks) {
				expect(err).to.be.null;
				expect(trucks.results).not.to.be.null;
				expect(trucks.results).to.have.length.above(0);
				done();				
			});
		});
	});
});