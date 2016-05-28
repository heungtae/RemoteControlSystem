
/*
 * GET home page.
 */

var history = require('../libs/db/history'),
	environment = require('../libs/db/environment'),
	ghConfig = require('../ghConfig'),
	log4js = require('log4js'),
	log = log4js.getLogger('routes.chart');

log.setLevel(config.loglevel);

module.exports = function(io){
	try{
		console.log('setting chart server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			ghConfig.getEnvironmentConfig(null, function(result){

				log.debug('get Environment config : ' + JSON.stringify(result));
				socket.emit('setEnvironment', result);
			
			});
			
			socket.on('getEnvironmentValue', function(conf){
				log.debug('[socket.on] getEnvironmentValue] ' + JSON.stringify(conf));
				
				environment.value(conf, function(err, result){
					log.debug('get Environement Value' + JSON.stringify(result));
					socket.emit('setEnvironmentValue', result);
				});				
			});			
		});		
	}catch(e){
		log.error(e);
	}	
};

module.exports.data = function(req, res){
	try{
		res.render('chart', {
			title : config.app.title.chart
		});
	}catch(e){
		log.error(e);
	}
};
