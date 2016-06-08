var ghConfig = require('../../ghConfig'),
	store = require('../store/emergencyControl'),
	log4js = require('log4js');

var	log = log4js.getLogger('libs.db.emergencyControl');

log.setLevel(config.loglevel);

exports.get = function(callback){
	try{
		store.read(function(err, docs){
			log.debug('found emergency Control Docs length= ' + docs.length);
			
			ghConfig.getShutterConfig(function(conf){
				log.debug('found shutter config length= ' + conf.length);

				ghConfig.getEnvironmentConfig(null, function(envConf){
					if(envConf == null)
						log.debug('found environment config: null');
					else
						log.debug('found environment config: length= ' + envConf.length);
					callback(err, docs, conf, envConf);											
				});
			});
			
		});
	}catch(e){
		log.error(e);
		callback(e, null, null, null);	
	}
};


exports.update = function(docs, callback){
	try{
		store.update(docs);
		
		callback('document(s) updated');
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};