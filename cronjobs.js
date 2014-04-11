var cronJob = require('cron').CronJob;
var trucksvc = require('./service/truck');

var jobCheckForData = new cronJob('00 00 * * * 0-6', (function() {
  trucksvc.refreshTruckData(function(err) {

  });
}), (function() { }), true);