var ghConfig = require('../../ghConfig'),
	store = require('../store/scheduleSprinkler'),
	log = require('log4js').getLogger('libs.db.scheduleSprinkler');

var get = function(callback){
	try{
		store.read(function(err, docs){
			log.trace('[get] found schedule sprinkler: length= ' + docs.length);
			
			ghConfig.getSprinklerConfig(function(confs){
				log.trace('[get] found sprinkler config: length= ' + confs.length);

				ghConfig.getEnvironmentConfig('sprinkler', function(envConfs){
					log.trace('[get] found environments config: length= ' + envConfs.length);
					
					callback(err, docs, confs, envConfs);											
				});
								
			});
			
		});
	}catch(e){
		log.error(e);
		callback(e, null, null, null);	
	}
};


var update = function(data, callback){
	try{
		store.update(data);
		callback('document(s) updated');
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};

module.exports = {
		update : update,
		get : read,
		read  : read
};