var expect = require('chai').expect;
var trucksvc = require('../service/truck');

describe('Truck', function() {

	/**
	 *  Setup
	 */

	before(function(done) {
		// Clear out the Truck collection, and seed a new one
		Truck.remove({}, function(err) {
			done();
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
	describe('#refreshData', function() {
		it('should load data from sfgov', function(done) {
			this.timeout(30000);
			trucksvc.refreshTruckData(function(err) {
				var req = {};
				trucksvc.getTrucks(req, function(err, trucks) {
					expect(err).to.be.null;
					expect(trucks.results).not.to.be.null;
					expect(trucks.results).to.have.length.above(100);
					done();
				});
			})
		})
	})
});