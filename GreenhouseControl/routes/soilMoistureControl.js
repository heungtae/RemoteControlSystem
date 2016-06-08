//var humidity = require('./humidity');
var controlData = require('../libs/db/soilMoistureControl'),
	log4js = require('log4js');

var	log = log4js.getLogger('routes.soilMoistureControl');
log.setLevel(config.loglevel);

var socket;

module.exports = function(io){
	try{
		console.log('setting soil moisture control server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			//schedule sprinkler socket function
			controlData.get(function(err, docs, conf, envConf){
				socket.emit('soilMoistureControlConfigCallback', docs, conf, envConf);
			});
			
			socket.on('soilMoistureControl', function(data){
				log.debug(data);
				controlData.update(data, function(){
					log.debug('Completed Sprinkler schedule');
					socket.emit('soilMoistureControlCallback');
				});
			});
			
		});		
	}catch(e){
		log.error(e);
	}	
};


module.exports.data = function(req, res){
	controlData.get(function(err, docs, conf, envConf){
		res.render('soilMoistureControl', {
			title : config.app.title.soilMoistureControl,
			soilMoistureDocs: docs,
			sprinklerConfig: conf,
			environmentConfig: envConf
		});
	});
};


