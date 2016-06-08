//var humidity = require('./humidity');
var gpio = require('../libs/gpio'),
	controlData = require('../libs/db/emergencyControl'),
	history = require('../libs/db/history'),
	log4js = require('log4js');

var	log = log4js.getLogger('routes.emergencyControl');
log.setLevel(config.loglevel);

var socket;

module.exports = function(io){
	try{
		console.log('setting emergency control server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			//schedule shutter socket function
			controlData.get(function(err, docs, conf, envConf){
				socket.emit('emergencyControlConfigCallback', docs, conf, envConf);
			});
			
			socket.on('emergencyControl', function(data){
				log.debug(data);
				controlData.update(data, function(){
					log.debug('Completed shutter schedule');
					socket.emit('emergencyControlCallback', data);
				});
			});
			         
			
		});		
	}catch(e){
		log.error(e);
	}	
};


module.exports.data = function(req, res){
	controlData.get(function(err, docs, conf, envConf){
		res.render('emergencyControl', {
			title : config.app.title.emergencyControl,
			emergencyControlDocs: docs,
			shutterConfig: conf,
			environmentConfig: envConf
		});
	});
};


