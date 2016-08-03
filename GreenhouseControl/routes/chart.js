
/*
 * GET home page.
 */

var history = require('../libs/db/history'),
	environment = require('../libs/db/environment'),
	ghConfig = require('../ghConfig'),
	log = require('log4js').getLogger('routes.chart');

module.exports = function(io){
	try{
		log.info('setting server.io');
		
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
