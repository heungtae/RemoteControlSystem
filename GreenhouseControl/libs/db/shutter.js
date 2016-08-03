var ghConfig = require('../../ghConfig'),
	store = require('../store/shutter'),
	log = require('log4js').getLogger('libs.db.shutter');

exports.get = function(callback){
	try{
		store.read(function(err, steps){
			ghConfig.getShutterConfig(function(docs){
				for (var i = 0; i < docs.length; i++) { 
					for(var j = 0; j < steps.length; j++){
						if( docs[i].side === steps[j].side && docs[i].position === steps[j].position){
							docs[i].step = steps[j].step;
							docs[i].runtime = steps[j].runtime;
							break;
						} 
					}
				}
				log.debug('found shutters documents: count= ' + docs.length);
				
				callback(err, docs);						
			});
		});
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};

exports.getShutter = function(data, callback){
	try{
		this.get(function(err, docs, value){
			for(var i =0; i < docs.length; i++){
				if(docs[i].side === data.side && docs[i].position === data.position){
					log.debug('found shutters document');
					
					callback(err, docs[i]);
					break;
				}
			}
		});
		
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};

exports.update = function(data, callback){
	try{
		store.addAndUpdate(data.side, data.position, data.step, data.runtime);
		callback('document(s) updated');
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};


