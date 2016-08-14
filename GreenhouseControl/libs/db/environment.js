/**
 * http://usejsdoc.org/
 */

var ghConfig = require('../../ghConfig'),
	store = require('../store/environment'),
	environment = require('../environment'),
	log = require('log4js').getLogger('libs.db.environment'),
	send = require('../telegram/send');

var get = function(conf, callback){
	try{
		store.read(conf, function(err, docs){
			if(docs != null)
				log.trace("[get] Environment Get: length = " + docs.length);
			
			callback(err, docs);
		});
	} catch(e){
		log.error(e);
		callback(e, null);
	}
};

var value = function(conf, callback){
	try{
		log.trace('[value] read environment config : ' + JSON.stringify(conf));
		
		ghConfig.getEnvironmentConfig(null, function(confs){
			log.trace('[value] get environment configs : ' + JSON.stringify(confs));
			
			var conf;
			for(idx in confs){
				conf = confs[idx];
				if(conf.unit == conf.unit && conf.zone == conf.zone)
					break;
			};
			
			log.trace('[value] found environment conf : ' + JSON.stringify(conf));
			log.debug('[value] value= ' + conf.value);
			
			callback(null, conf);
			
		});
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};

var update = function(conf, remainDay){
	try{
		store.update(conf, remainDay);
	}catch(e){
		log.error(e);
	}
}

module.exports = {
		update : update,
		get : read,
		read  : read,
		value : value
};
