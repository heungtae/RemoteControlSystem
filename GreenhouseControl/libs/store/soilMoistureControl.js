const fs = require('fs');
var log4js = require('log4js');
var	log = log4js.getLogger('libs.store.soilMoistureControl');
log.setLevel(config.loglevel);

var soilMoistureControlFile = './datas/soilMoistureControl.dat';

//delete는 id를 제외한 모든 데이터를 삭제하는 것으로 진행한다.
exports.update = function(docs){
	try{
		log.debug('update: ' + soilMoistureControlFile);
		var docsJSON = JSON.stringify(docs, null, 4);
		
		log.trace('[update] write string, ' + docsJSON);
		
		fs.writeFileSync(soilMoistureControlFile, docsJSON);
		
	}catch(e){
		log.error(e);
	}
};

exports.read = function(callback){
	try{
		log.debug('read: ' + soilMoistureControlFile);
		var file = fs.readFile(soilMoistureControlFile, function(err, data){
			if(err != undefined && err != null){
				log.error(err);
			}
			
			if(data == undefined || data.length == 0)
				data = '[ ]';
			
			log.debug('[read] read data, ' + data);
			
			var docs = JSON.parse(data);
			
			log.debug(JSON.stringify(docs));
			callback(null, docs);
		});
	}catch(e){
		callback(e, null);
	}
};