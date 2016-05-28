//var humidity = require('./humidity');
var notificationData = require('../libs/db/notification'),
	log4js = require('log4js');

var	log = log4js.getLogger('routes.notification');
log.setLevel(config.loglevel);

var socket;

module.exports = function(io){
	try{
		console.log('setting notification -- server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			//schedule shutter socket function
			notificationData.get(function(err, docs, conf, envConf){
				socket.emit('notificationConfigCallback', docs, conf, envConf);
			});
			
			socket.on('notification', function(docs){
				log.debug(docs);
				notificationData.update(docs, function(){
					log.debug('Completed notification schedule');
					socket.emit('scheduleNotificationCallback');
				});
			});
			
			
		});		
	}catch(e){
		log.error(e);
	}	
};


module.exports.data = function(req, res){
	notificationData.get(function(err, docs, conf, envConf){
		res.render('notification', {
			title : config.app.title.shutterSchedule,
			shutterSchedule: docs,
			shutterConfig: conf,
			environmentConfig: envConf
		});
	});
};


