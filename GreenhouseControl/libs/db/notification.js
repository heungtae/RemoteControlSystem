var ghConfig = require('../../ghConfig'),
	store = require('../store/notification'),
	log = require('log4js').getLogger('libs.db.notification');

exports.get = function(callback){
	try{
		store.read(function(err, docs){
			log.debug('found notification: length= ' + docs.length);
			ghConfig.getEnvironmentConfig(null, function(envConf){
				if(envConf == null)
					log.debug('found environment config: null');
				else
					log.debug('found environment config: length= ' + envConf.length);
				callback(err, docs, envConf);											
			});
			
		});
	}catch(e){
		log.error(e);
		callback(e, null, null);	
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