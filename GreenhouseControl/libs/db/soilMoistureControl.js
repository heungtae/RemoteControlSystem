var ghConfig = require('../../ghConfig'),
	store = require('../store/soilMoistureControl'),
	log4js = require('log4js');

var	log = log4js.getLogger('libs.db.soilMoistureControl');

log.setLevel(config.loglevel);

exports.get = function(callback){
	try{
		store.read(function(err, docs){
			log.debug('found soil moisture control docs length= ' + docs.length);
			
			ghConfig.getSprinklerConfig(function(conf){
				log.debug('found sprinkler config: length= ' + conf.length);

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
		callback('document(s) updated');
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};