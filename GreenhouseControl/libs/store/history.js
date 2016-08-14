var fs = require('fs'),
	log = require('log4js').getLogger('libs.store.historyFile');

var historyFile = './datas/history.dat';
var docs;

//sync write
var update = function(val, remainDay){
	try{
		
		read(function(err, datas){
			var updateDocs =[];
			
			//가장 최근 데이터를 가장 앞에 넣는다.
			updateDocs.push({date: new Date(), history : val});
			
			for(var key in datas) {
				var dateVal = new Date(datas[key].date);
				
				if( dateVal.getTime() > remainDay.getTime() ){
					updateDocs.push(datas[key]);
				}
			}	
			
			docs = updateDocs;
			
			file.update(historyFile, docs);
		})
	}catch(e){
		log.error(e);
	}
}

//async read
var read = function(callback){
	try{
		if(docs != undefined)
			callback(null, docs);
		
		file.read(historyFile, function(err, readDocs){
			//메모리상의 데이터를 업데이트 한다.
			docs = readDocs;
			callback(err, docs);
		});
	}catch(e){
		callback(e, null);
	}
}

module.exports = {
		update : update,
		read : read
};