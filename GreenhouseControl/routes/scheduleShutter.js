//var humidity = require('./humidity');
var shutterData = require('../libs/db/scheduleShutter'),
	log = require('log4js').getLogger('routes.scheduleShutter');

var socket;

module.exports = function(io){
	try{
		log.info('setting server.io');
		
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


