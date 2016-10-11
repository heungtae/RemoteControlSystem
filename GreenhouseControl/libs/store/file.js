const fs = require('fs');
var log = require('log4js').getLogger('libs.store.file');

//sync write
//delete는 id를 제외한 모든 데이터를 삭제하는 것으로 진행한다.
var updateSync = function(filename, docs){
	try{
		log.debug('[updateSync] ' + filename);
		
		var docsJSON = JSON.stringify(docs, null, 4);
		
		log.trace('[updateSync] write string, ' + docsJSON);
		
		fs.writeFileSync(filename, docsJSON);
		
	}catch(e){
		log.error(e);
	}
};

//sync read
var readSync = function(filename, callback){
	try{
		log.debug('[readSync] ' + filename);
		
		var data = fs.readFileSync(filename);
		
		if(data == undefined || data.length == 0)
			data = '[ ]';
		
		log.trace('[readSync] read data, ' + data);
		
		var docs = JSON.parse(data);
		
		callback(null, docs);
		
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};

var read = function(filename, callback){
	try{
		log.debug('[read] ' + filename);
		
		fs.readFile(filename,  function(err, data) {
			if(err != undefined && err != null){
				log.error(err);
			}
			log.trace('[read] read data, ' + data);
			
			if(data.length == undefined || data.length == 0)
				data = '[ ]';
		
			log.trace('[readSync] read data, ' + data);
			
			var docs = JSON.parse(data);
			
			callback(null, docs);
			
		});
	}catch(e){
		log.error(e);
		callback(e, null);
	}
}

module.exports = {
		updateSync : updateSync,
		readSync : readSync,
		read : read
};