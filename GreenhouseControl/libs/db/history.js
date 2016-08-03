var log = require('log4js').getLogger('libs.db.history'),
	store = require('../store/history');

exports.insert = function(name, data){
	try{

		var historyData = name + ' : ' + JSON.stringify(data).replace(/,/gi,", ");
		
		log.debug(historyData);
		

		var remainDate = new Date();
		remainDate.setDate(remainDate.getDate() - config.app.history.remainday);

        store.add(historyData, remainDate);
		
	} catch(e){
		log.error(e);
	}
};

exports.select = function(callback){
	try{
		store.read(function(err, docs) {
			if (err) {
				log.error(err);
			}else {
					log.debug('found history documents: count= ' + docs !== null ? docs.length : 0);
			}
			
			callback(err, docs);
		});
		
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};
