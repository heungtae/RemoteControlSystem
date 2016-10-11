var file = require('./file'),
	log = require('log4js').getLogger('libs.store.environment');

var prefix = './datas/environment';
var docs = {};

var update = function(conf, remainDay){
	try{
		
		read(conf, function(err, datas){
			var envFile = prefix + '-' + conf.unit + '-' + conf.zone + '.dat';
			var updateDocs =[];
			
			//가장 최근 데이터를 가장 앞에 넣는다.
			updateDocs.push({date: new Date(), unit : conf.unit, zone: conf.zone, value: conf.value});
			
			var count = 0;	
			for(var key in datas) {
				var dateVal = new Date(datas[key].date);
				
				if( dateVal.getTime() > remainDay.getTime() ){
					updateDocs.push(datas[key]);
				}
			}	
			
			//메모리상의 데이터를 업데이트 한다.
			docs[envFile] = updateDocs;
			
			file.updateSync(envFile, updateDocs);
		})
	}catch(e){
		log.error(e);
	}
}

var read = function(conf, callback){
	try{	
		var envFile = prefix + '-' + conf.unit + '-' + conf.zone + '.dat';

		if(docs[envFile] != undefined && docs[envFile] != null)
			callback(null, docs[envFile]);
		
		file.readSync(envFile, function(err, readDocs){
			//메모리상의 데이터를 업데이트 한다.
			docs[envFile] = readDocs;
			callback(err, readDocs);
		});
	}catch(e){
		callback(e, null);
	}
}

module.exports = {
		update : update,
		read : read
};