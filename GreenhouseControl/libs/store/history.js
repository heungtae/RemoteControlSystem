const fs = require('fs');
var log = require('log4js').getLogger('libs.store.historyFile');

var historyFile = './datas/history.dat';

exports.add = function(val, remainDay){
	try{
		
		read(function(err, docs){
			var newDocs =[];
			
			var count = 0;	
			for(var key in docs) {
				var dateVal = new Date(docs[key].date);
				
				if( dateVal.getTime() > remainDay.getTime() ){
					newDocs[count++] = docs[key];
				}
			}	
			
			var obj = {date: new Date(), history : val};
			newDocs.push(obj);
			
			var docsJSON = JSON.stringify(newDocs, null, 4);
			
			log.trace('[add] write string, ' + docsJSON);
			
			fs.writeFileSync(historyFile, docsJSON);
		})
	}catch(e){
		log.error(e);
	}
}


exports.read = function(callback){
	try{
		fs.readFile(historyFile,  function(err, data) {
			if(err != undefined && err != null){
				log.error(err);
			}
			log.trace('[read] read data, ' + data);
			
			if(data.length == undefined || data.length == 0)
				data = '[ ]';
			
			var docs = JSON.parse(data);
			
			var newDocs =[];
			var len = docs.length;
			
			for(i = len -1; i >= 0; i--){
				newDocs.push(docs[i]);
			}
			
			callback(null, newDocs);
			
		});
	}catch(e){
		callback(e, null);
	}
}