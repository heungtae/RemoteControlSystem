
/*
 * GET home page.
 */

var history = require('../libs/db/history'),
	environment = require('../libs/db/environment'),
	ghConfig = require('../ghConfig'),
	log4js = require('log4js'),
	log = log4js.getLogger('routes.index');

log.setLevel(config.loglevel);

module.exports = function(io){
	try{
		console.log('setting index server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			ghConfig.getEnvironmentConfig(null, function(result){
				log.debug('get Environment config : ' + JSON.stringify(result));
				socket.emit('setEnvironment', result);
			});
			
			socket.on('getEnvironmentValue', function(conf){
				log.debug(conf);
				
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

module.exports.index = function(req, res){
	try{
		history.select(function(err, docs) {
			log.debug('found history documents: count= ' + docs.length);
			res.render('index', {
				title : config.app.title.home,
				histories: docs
			});
		});	
	}catch(e){
		log.error(e);
	}
};
