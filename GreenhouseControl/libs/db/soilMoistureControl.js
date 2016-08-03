var ghConfig = require('../../ghConfig'),
	store = require('../store/soilMoistureControl'),
	log = require('log4js').getLogger('libs.db.soilMoistureControl');

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