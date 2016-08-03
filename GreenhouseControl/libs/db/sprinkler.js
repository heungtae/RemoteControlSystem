var ghConfig = require('../../ghConfig'),
	store = require('../store/sprinkler'),
	log = require('log4js').getLogger('libs.db.sprinkler');

exports.get = function(callback){
	try{
		store.read(function(err, settimes){
			log.debug(JSON.stringify(settimes));
			
			ghConfig.getSprinklerConfig(function(docs){
				for (var i = 0; i < docs.length; i++) { 
					for(var j = 0; j < settimes.length; j++){
						if( docs[i].unit === settimes[j].unit){
							docs[i].settime = settimes[j].settime;
							break;
						} 
					}
				}
				
				log.debug('found sprinkler documents: count= ' + docs.length);
				callback(err, docs);						
			});
		});
	}catch(e){
		log.error(e);
		callback(e, null, null);	
	}
};


exports.update = function(data, callback){
	try{
		store.addAndUpdate(data.unit, data.settime);
		callback('document(s) updated');
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};