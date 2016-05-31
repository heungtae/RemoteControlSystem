//var humidity = require('./humidity');
var gpio = require('../libs/gpio'),
	shutterData = require('../libs/db/temperatureControl'),
	history = require('../libs/db/history'),
	log4js = require('log4js');

var	log = log4js.getLogger('routes.temperatureControl');
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
				socket.emit('temperatureControlConfigCallback', docs, conf, envConf);
			});
			
			socket.on('temperatureControl', function(data){
				log.debug(data);
				shutterData.update(data, function(){
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
	shutterData.get(function(err, docs, conf, envConf){
		res.render('temperatureControl', {
			title : config.app.title.temperatureControl,
			temperatureControlDocs: docs,
			shutterConfig: conf,
			environmentConfig: envConf
		});
	});
};


