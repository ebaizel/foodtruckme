
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , creds = require('./creds')
  , trucksvc = require('./service/truck')
  , path = require('path')
  , cluster = require('cluster');

if (cluster.isMaster) {

  // Master does nothing but manage cluster workers
  
  var numCPUs = require('os').cpus().length;
  console.log('** Hardware is running on ' + numCPUs + ' cpus. **');

  for (var i=0; i < numCPUs; i++) {
    cluster.fork(process.env);
  }

  // Restart worker if app dies
  cluster.on('exit', function (deadWorker) {
    console.log('worker died.  restarting...');
    cluster.fork();
  });

  // Nothing we can do; log and stay alive
  process.on('uncaughtException', function(err) {
    console.log('process died ', err);
  })

} else {

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
    app.locals.dburi = (cluster.worker.process.env.dburidev ? cluster.worker.process.env.dburidev : creds.dburidev);
    app.locals.socratatoken = (cluster.worker.process.env.socratatoken ? cluster.worker.process.env.socratatoken : creds.socratatoken);
  }

  // production only
  if (app.get('env') === 'production') {
    app.use(express.errorHandler());
    app.locals.pretty = false;
    app.locals.port = cluster.worker.process.env.PORT || 80;
    app.locals.dburi = (cluster.process.env.dburiprod ? cluster.process.env.dburiprod : creds.dburiprod);
    app.locals.socratatoken = (cluster.worker.process.env.socratatoken ? cluster.worker.process.env.socratatoken : creds.socratatoken);
  };

  /*
   * ERROR HANDLING
   */

  var logErrors = function(err, req, res, next) {
    console.error(err.stack);
    next(err);
  };

  function clientErrorHandler(err, req, res, next) {
    if (req.xhr) {
      res.send(500, { error: err });
    } else {
      next(err);
    }
  }

  function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
  }

  app.use(logErrors);
  app.use(clientErrorHandler);
  app.use(errorHandler);

  /**
   * Routes
   */

  app.get('/', routes.index);
  app.get('/truck', routes.getTrucks);  //see truck svc for query params
  app.get('/geocode', routes.geoCodeAddress);

  /**
   * Configure the app
   */

  require('./config')(app);

  /**
    * Fire up the cron jobs
    */

  require('./cronjobs');

  /**
   * Start Server
   */

  http.createServer(app).listen(app.locals.port, function(){
    console.log('Server listening on port ' + app.locals.port + ' on cluster worker id ' + cluster.worker.id);
    trucksvc.refreshTruckData(function(err) {
      if (err) {  // can't do much, just log error
        console.log('Error refreshing data ' + err);
      }
    });
  });

}