var mongoose = require('mongoose');
var models = require('./models');
var creds = require('./creds');
var dburi;
var cluster = require('cluster');

var getDB = function(uri) {
	var db;
	db = mongoose.createConnection(uri);
	db.on('error', console.error.bind(console, 'connection error:'));
	return db;
};

global.closeDB = function(db) {
	return db.close();
}

module.exports = function(app) {
	global.db = getDB(app.locals.dburi);
	global.socratatoken = app.locals.socratatoken;
	global.Truck = global.db.model('Truck', models.truckSchema);
}