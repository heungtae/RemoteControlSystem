//var humidity = require('./humidity');
var controlData = require('../libs/db/soilMoistureControl'),
	log = require('log4js').getLogger('routes.soilMoistureControl');

var socket;

module.exports = function(io){
	try{
		log.info('setting server.io');
		
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


