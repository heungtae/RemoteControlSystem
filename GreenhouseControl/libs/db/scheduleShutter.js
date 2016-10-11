var ghConfig = require('../../ghConfig'),
	store = require('../store/scheduleShutter'),
	log = require('log4js').getLogger('libs.db.scheduleShutter');

var get = function(callback){
	try{
		store.read(function(err, docs){
			log.trace('[get] found schedule shutter: length= ' + docs.length);
			
			ghConfig.getShutterConfig(function(confs){
				log.trace('[get] found shutter configs: length= ' + confs.length);

				ghConfig.getEnvironmentConfig('shutter', function(envConfs){
					log.trace('[get] found environment configs: length= ' + envConfs.length);
					
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
		
		callback('document(s) updated');
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