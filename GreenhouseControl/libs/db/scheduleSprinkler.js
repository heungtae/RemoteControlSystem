var ghConfig = require('../../ghConfig'),
	store = require('../store/scheduleSprinkler'),
	log4js = require('log4js');

var	log = log4js.getLogger('libs.db.scheduleSprinkler');

log.setLevel(config.loglevel);

exports.get = function(callback){
	try{
		store.read(function(err, docs){
			log.debug('found schedule sprinkler: length= ' + docs.length);
			
			ghConfig.getSprinklerConfig(function(conf){
				log.debug('found shutter config: length= ' + conf.length);

				ghConfig.getEnvironmentConfig('sprinkler', function(envConf){
					log.debug('found environments config: length= ' + envConf.length);
					callback(err, docs, conf, envConf);											
				});
								
			});
			
		});
	}catch(e){
		log.error(e);
		callback(e, null, null, null);	
	}
};


exports.update = function(data, callback){
	try{
		store.update(data);
		callback(err, 'document(s) updated');
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};