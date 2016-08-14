var ghConfig = require('../../ghConfig'),
	store = require('../store/notification'),
	log = require('log4js').getLogger('libs.db.notification');

var read = function(callback){
	try{
		store.read(function(err, docs){
			log.trace('[get] found notification: length= ' + docs.length);
			
			ghConfig.getEnvironmentConfig(null, function(envConfs){
				log.trace('[get] found environment configs: length= ' + envConfs.length);
				
				callback(err, docs, envConfs);											
			});
			
		});
	}catch(e){
		log.error(e);
		callback(e, null, null);	
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
		get : read,
		read  : read
};