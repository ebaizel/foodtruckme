
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , creds = require('./creds')
  , trucksvc = require('./service/truck')
  , cronjobs = require('./cronjobs')
  , path = require('path');

var app = express();

// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.locals.pretty = true;
	app.locals.port = 1083;
	app.locals.dburi = (process.env.dburidev ? process.env.dburidev : creds.dburidev);
  app.locals.socratatoken = (process.env.socratatoken ? process.env.socratatoken : creds.socratatoken);
}

// production only
if (app.get('env') === 'production') {
	app.use(express.errorHandler());
	app.locals.pretty = false;
	app.locals.port = process.env.PORT | 80;
	app.locals.dburi = (process.env.dburiprod ? process.env.dburiprod : creds.dburiprod);
  app.locals.socratatoken = (process.env.socratatoken ? process.env.socratatoken : creds.socratatoken);
};

/*
 * ERROR HANDLING
 */

var logErrors = function(err, req, res, next) {
  console.error(err.stack);
  next(err);
};

var clientErrorHandler = function(err, req, res, next) {
  res.json(500, {
    error: err
  });
};

app.use(logErrors);
app.use(clientErrorHandler);
//app.use(errorHandler);

/**
 * Routes
 */

app.get('/', routes.index);
app.get('/truck', routes.getTrucks);
app.get('/geocode', routes.geoCodeAddress)

/**
 * Configure the app
 */

require('./config')(app);

/**
 * Start Server
 */

http.createServer(app).listen(app.locals.port, function(){
  console.log('Express server listening on port ' + app.locals.port);
  trucksvc.refreshTruckData(function(err) {

  });
});
