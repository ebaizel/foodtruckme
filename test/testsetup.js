var models = require('../models');
var mongoose = require('mongoose');

global.socratatoken = require('../creds').socratatoken;

var db = mongoose.createConnection('localhost/foodtrucktest');
db.on('error', console.error.bind(console, 'connection error:'));
global.Truck = db.model('Truck', models.truckSchema);
