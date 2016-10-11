var ghConfig = require('../../ghConfig'),
	store = require('../store/temperatureControl'),
	log = require('log4js').getLogger('libs.db.temperatureControl');

var get = function(callback){
	try{
		store.read(function(err, docs){
			log.trace('[get] found temperature Control Docs length= ' + docs.length);
			
			ghConfig.getShutterConfig(function(confs){
				log.trace('[get] found shutter config length= ' + confs.length);

				ghConfig.getEnvironmentConfig('temperature', function(envConfs){
					if(envConfs == null)
						log.debug('[get] found environment config: null');
					else
						log.trace('[get] found environment config: length= ' + envConfs.length);
					callback(err, docs, confs, envConfs);											
				});
			});
			
		});
	}catch(e){
		log.error(e);
		callback(e, null, null, null);	
	}
};


var update = function(docs, callback){
	try{
		store.update(docs);
		
		callback(' document(s) updated');
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};

module.exports = {
		update : update,
		get : get,
		read  : get
};