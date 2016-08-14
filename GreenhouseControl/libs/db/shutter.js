var ghConfig = require('../../ghConfig'),
	store = require('../store/shutter'),
	log = require('log4js').getLogger('libs.db.shutter');

exports.get = function(callback){
	try{
		store.read(function(err, steps){
			ghConfig.getShutterConfig(function(confs){
				for (var i = 0; i < confs.length; i++) { 
					for(var j = 0; j < steps.length; j++){
						if( confs[i].side === steps[j].side && confs[i].position === steps[j].position){
							confs[i].step = steps[j].step;
							confs[i].runtime = steps[j].runtime;
							break;
						} 
					}
				}
				
				log.debug('[get] found shutters documents: count= ' + confs.length);
				
				callback(err, confs);						
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
					log.debug('[getShutter] found shutters document');
					
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
		store.update(data.side, data.position, data.step, data.runtime);
		
		callback('document(s) updated');
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};

module.exports = {
		update : update,
		get : read,
		read  : read,
		getShutter : getShutter
};


