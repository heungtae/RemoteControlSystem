//var humidity = require('./humidity');
var shutterData = require('../libs/db/scheduleShutter'),
	log4js = require('log4js');

var	log = log4js.getLogger('routes.scheduleShutter');
log.setLevel(config.loglevel);

var socket;

module.exports = function(io){
	try{
		console.log('setting schedule shutter server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			//schedule shutter socket function
			shutterData.get(function(err, docs, conf, envConf){
				socket.emit('scheduleShutterConfigCallback', docs, conf, envConf);
			});
			
			socket.on('scheduleShutter', function(docs){
				log.debug(docs);
				shutterData.update(docs, function(){
					log.debug('Completed shutter schedule');
					socket.emit('scheduleShutterCallback');
				});
			});
			
			
		});		
	}catch(e){
		log.error(e);
	}	
};


module.exports.data = function(req, res){
	shutterData.get(function(err, docs, conf, envConf){
		res.render('scheduleShutter', {
			title : config.app.title.shutterSchedule,
			shutterSchedule: docs,
			shutterConfig: conf,
			environmentConfig: envConf
		});
	});
};


