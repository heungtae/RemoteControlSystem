/* Copyright (C) Heung-tae Kim - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Heung-tae Kim <heungtae@gmail.com>, May 2016
 */

/**
 * Module dependencies.
 */
global.config = require('./config');

var express = require('express')
  , routes = require('./routes')
  , bodyParser = require('body-parser')
  , chart = require('./routes/chart')
  , sprinkler = require('./routes/sprinkler')
  , shutter = require('./routes/shutter')
  , scheduleSprinkler = require('./routes/scheduleSprinkler')
  , scheduleShutter = require('./routes/scheduleShutter')
  , notification = require('./routes/notification')
  , soilMoistureControl = require('./routes/soilMoistureControl')
  , tempControl = require('./routes/temperatureControl')
  , emergencyControl = require('./routes/emergencyControl')
//  , scheduleSprinklerJob = require('./libs/job/scheduleSprinkler')
  , scheduleShutterJob = require('./libs/job/scheduleShutter')
  , scheduleEnvironmentJob = require('./libs/job/scheduleEnvironment')
//  , notificationJob = require('./libs/job/notification')
//  , env = require('./libs/db/environment')
  , log4js = require('log4js') 
  , http = require('http')
  , path = require('path');


var app = express();

// all environments
app.set('port', config.app.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

//
// Authenticator
//
app.use(express.basicAuth(function(user, pass) {
  console.log(arguments);
  return user === 'yesan' && pass === 'yesan2015';
}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'lib')));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

log4js.configure('log4j.json', { reloadSecs: 300 });
log4js.setGlobalLogLevel(config.loglevel);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
app.get('/', chart.data);
app.get('/chart', chart.data);
app.get('/shutter', shutter.data);
app.get('/sprinkler', sprinkler.data);
app.get('/scheduleSprinkler', scheduleSprinkler.data);
app.get('/scheduleShutter', scheduleShutter.data);
app.get('/notification', notification.data);
app.get('/history', routes.index);
app.get('/soilMoistureControl', soilMoistureControl.data);
app.get('/temperatureControl', tempControl.data);
app.get('/emergencyControl', emergencyControl.data);


var	log = log4js.getLogger('app');

// Exception Handler 등록
//process.on('uncaughtException', function (err) {
//	log.error('Caught exception: ' + err);
//});

var server = http.createServer(app);

server.listen(app.get('port'), function(){
	var io = require('socket.io')(server);
	
	routes(io);
	chart(io);
	shutter(io);
	sprinkler(io);
	scheduleShutter(io);
	scheduleSprinkler(io);
	notification(io);
	soilMoistureControl(io);
	tempControl(io);
	emergencyControl(io);
	
	log.info('Express server listening on port ' + app.get('port'));
});


