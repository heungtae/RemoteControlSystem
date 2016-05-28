const fs = require('fs');
var log4js = require('log4js');
var	log = log4js.getLogger('libs.store.sprinkler');
log.setLevel(config.loglevel);

var sprinklerFile = './datas/sprinkler.dat';

exports.addAndUpdate = function(unit, settime){
	try{
		var data = fs.readFileSync(sprinklerFile);
		if(data.length == 0)
			data = '[ ]';
		
		log.trace('[addAndUpdate] read data, ' + data);
		
		var docs = JSON.parse(data);
		unit = unit.trim();
		
		var count = 0;
		for(var key in docs) {
			if( docs[key].unit === unit ){
				docs[key].date = new Date();
				docs[key].settime = settime;
				count++;
			}
		}	
		
		if(count === 0){
			var obj = {date: new Date(), unit: unit, settime: settime};
			
			docs.push(obj);
		}
		
		var docsJSON = JSON.stringify(docs, null, 4);
		
		log.trace('[add] write string, ' + docsJSON);
		
		fs.writeFileSync(sprinklerFile, docsJSON);
	}catch(e){
		log.error(e);
	}
};

exports.read = function(callback){
	try{
		fs.readFile(sprinklerFile, function(err, data){
			if(err != undefined && err != null){
				log.error(err);
			}
			
			if(data.length == 0)
				data = '[ ]';
			
			log.trace('[read] read data, ' + data);
			
			var docs = JSON.parse(data);
			
			log.trace(JSON.stringify(docs));
			callback(null, docs);
		});
	}catch(e){
		log.error(e);
		callback(e, null);
	}
};