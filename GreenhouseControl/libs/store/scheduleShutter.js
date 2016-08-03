const fs = require('fs');
var log = require('log4js').getLogger('libs.store.scheduleShutter');

var scheduleShutterFile = './datas/scheduleShutter.dat';

//delete는 id를 제외한 모든 데이터를 삭제하는 것으로 진행한다.
exports.update = function(docs){
	try{
		log.debug('update: ' + scheduleShutterFile);
		var docsJSON = JSON.stringify(docs, null, 4);
		
		log.trace('[update] write string, ' + docsJSON);
		
		fs.writeFileSync(scheduleShutterFile, docsJSON);
		
	}catch(e){
		log.error(e);
	}
};

exports.read = function(callback){
	try{
		log.debug('read: ' + scheduleShutterFile);
		var file = fs.readFile(scheduleShutterFile, function(err, data){
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