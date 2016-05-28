//var humidity = require('./humidity');
var sprinklerData = require('../libs/db/scheduleSprinkler'),
	log4js = require('log4js');

var	log = log4js.getLogger('routes.scheduleSprinkler');
log.setLevel(config.loglevel);

var socket;

module.exports = function(io){
	try{
		console.log('setting schedule sprinkler server.io');
		
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


