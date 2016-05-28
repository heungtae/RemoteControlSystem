const fs = require('fs');
var log4js = require('log4js');
var	log = log4js.getLogger('libs.store.shutter');
log.setLevel(config.loglevel);

var shutterFile = './datas/shutter.dat';

exports.addAndUpdate = function(side, position, step, runtime){
	try{
		var data = fs.readFileSync(shutterFile);
		
		if(data.length == 0)
			data = '[ ]';
		log.trace('[addAndUpdate] read data, ' + data);
		
		var docs = JSON.parse(data);
		
		var count = 0;
		for(var key in docs) {
			if( docs[key].side === side && docs[key].position === position ){
				docs[key].date = new Date();
				docs[key].step = step;
				docs[key].runtime = runtime;
				count++;
			}
		}	
		
		if(count === 0){
			var obj = {date: new Date(), side: side, position: position, step: step, runtime: runtime};
			
			docs.push(obj);
		}
		
		var docsJSON = JSON.stringify(docs, null, 4);
		
		log.trace('[add] write string, ' + docsJSON);
		
		fs.writeFileSync(shutterFile, docsJSON);
	}catch(e){
		log.error(e);
	}
};

exports.read = function(callback){
	try{
		fs.readFile(shutterFile, function(err, data){
			if(err != undefined && err != null){
				log.error(err);
			}
		
			if(data.length == 0)
				data = '[ ]';
			log.trace('[read] read data, ' + data);
			
			var docs = JSON.parse(data);
			
			callback(null, docs);			
		});
	}catch(e){
		callback(e, null);
	}
};