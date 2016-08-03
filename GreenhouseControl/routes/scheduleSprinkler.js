//var humidity = require('./humidity');
var sprinklerData = require('../libs/db/scheduleSprinkler'),
	log = require('log4js').getLogger('routes.scheduleSprinkler');

var socket;

module.exports = function(io){
	try{
		log.info('setting server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			//schedule sprinkler socket function
			sprinklerData.get(function(err, docs, conf, envConf){
				socket.emit('scheduleSprinklerConfigCallback', docs, conf, envConf);
			});
			
			socket.on('scheduleSprinkler', function(data){
				log.debug(data);
				sprinklerData.update(data, function(){
					log.debug('Completed Sprinkler schedule');
					socket.emit('scheduleSprinklerCallback');
				});
			});
			
		});		
	}catch(e){
		log.error(e);
	}	
};


module.exports.data = function(req, res){
	sprinklerData.get(function(err, docs, conf, envConf){
		res.render('scheduleSprinkler', {
			title : config.app.title.sprinklerSchedule,
			sprinklerSchedule: docs,
			sprinklerConfig: conf,
			environmentConfig: envConf
		});
	});
};


