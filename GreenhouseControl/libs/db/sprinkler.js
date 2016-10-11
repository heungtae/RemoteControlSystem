var ghConfig = require('../../ghConfig'),
	store = require('../store/sprinkler'),
	log = require('log4js').getLogger('libs.db.sprinkler');

var get = function(callback){
	try{
		store.read(function(err, docs){
			ghConfig.getSprinklerConfig(function(confs){
				for (var i = 0; i < confs.length; i++) { 
					for(var j = 0; j < docs.length; j++){
						if( confs[i].unit === docs[j].unit){
							confs[i].settime = docs[j].settime;
							break;
						} 
					}
				}
				
				log.trace('[get] found sprinkler documents: count= ' + confs.length);
				
				callback(err, confs);						
			});
		});
	}catch(e){
		log.error(e);
		callback(e, null, null);	
	}
};


var update = function(data, callback){
	try{
		store.update(data.unit, data.settime);
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