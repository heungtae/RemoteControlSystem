//var humidity = require('./humidity');
var gpio = require('../libs/gpio'),
	controlData = require('../libs/db/temperatureControl'),
	history = require('../libs/db/history'),
	log = require('log4js').getLogger('routes.temperatureControl');

var socket;

module.exports = function(io){
	try{
		log.info('setting server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			//schedule shutter socket function
			controlData.get(function(err, docs, conf, envConf){
				socket.emit('temperatureControlConfigCallback', docs, conf, envConf);
			});
			
			socket.on('temperatureControl', function(data){
				log.debug(data);
				controlData.update(data, function(){
					log.debug('Completed shutter schedule');
					socket.emit('temperatureControlCallback', data);
				});
			});
			         
			
		});		
	}catch(e){
		log.error(e);
	}	
};


module.exports.data = function(req, res){
	controlData.get(function(err, docs, conf, envConf){
		res.render('temperatureControl', {
			title : config.app.title.temperatureControl,
			temperatureControlDocs: docs,
			shutterConfig: conf,
			environmentConfig: envConf
		});
	});
};


