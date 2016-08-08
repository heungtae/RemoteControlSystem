const fs = require('fs');
var log = require('log4js').getLogger('libs.store.environment');

var prefix = './datas/environment';

exports.add = function(conf, remainDay){
	try{
		
		readData(conf, function(err, docs){
			var envFile = prefix + '-' + conf.unit + '-' + conf.zone + '.dat';
			var newDocs =[];
			
			var count = 0;	
			for(var key in docs) {
				var dateVal = new Date(docs[key].date);
				
				if( dateVal.getTime() > remainDay.getTime() ){
					newDocs[count++] = docs[key];
				}
			}	
			
			var obj = {date: new Date(), unit : conf.unit, zone: conf.zone, value: conf.value};
			newDocs.push(obj);
			
			conf.docs = newDocs;
			
			var docsJSON = JSON.stringify(newDocs, null, 4);
			
			//log.trace('[add] write string, ' + docsJSON);
			log.trace('[add] write string, ' + JSON.stringify(conf));
			fs.writeFileSync(envFile, docsJSON);
		})
	}catch(e){
		log.error(e);
	}
}

var readData = exports.read = function(conf, callback){
	try{	
		log.trace('[readData] ' + JSON.stringify(conf));
		
		if(conf.docs == undefined){
			readFile(conf, function(err, docs){
				log.trace('[readData] file read, conf: ' + JSON.stringify(conf) + ' docs: ' + JSON.stringify(docs));
				callback(err, docs);
			})
		}else{
			log.trace('[readData] conf read, conf: ' + JSON.stringify(conf));
			callback(null, conf.docs);
		}
		
		
	}catch(e){
		callback(e, null);
	}
}

var readFile = function(conf, callback){
	try{
		var envFile = prefix + '-' + conf.unit + '-' + conf.zone + '.dat';
		log.trace('[readfile] path = ' + envFile);
		
		fs.readFile(envFile, function(err, data){
			if(err != undefined && err != null){
				log.error(err);
			}
			
			if(data == undefined || data.length == 0)
				data = '[ ]';
			
			var docs = JSON.parse(data);
			
			log.trace('[readfile] docs length = ' + docs.length);
			callback(null, docs);
			
		});
	}catch(e){
		log.error(e);
		callback(e, null);
	}
}

