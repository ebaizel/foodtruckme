var Schema = require('mongoose').Schema;
ObjectId = Schema.ObjectId

var truckSchema = new Schema({
	_id: {
		type: ObjectId
	},
	srcid: {
		type: String
	},
    loc: {
		lon: Number,
		lat: Number
    },
    desc: {
    	type: String
    },
    status: {
    	type: String
    },
	address: {
		type: String
	},
	name: {
		type: String
	},
	created: {
		type: Date
	}
}, {collection: 'truck'});

truckSchema.index({ loc: "2d" }); // geospatial

exports.truckSchema = truckSchema;