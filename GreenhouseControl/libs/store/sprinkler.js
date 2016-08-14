var file = require('file'),
	log = require('log4js').getLogger('libs.store.sprinkler');

var sprinklerFile = './datas/sprinkler.dat';
var docs;

var update = function(unit, settime){
	try{
		
		read(function(err, datas){
			settime = settime === undefined ? 0 : settime;
			
			var count = 0;
			for(var key in datas) {
				if( datas[key].unit === unit ){
					datas[key].date = new Date();
					datas[key].settime = settime;
					count++;
					break;
				}
			}	
			
			if(count === 0)	
				datas.push({date: new Date(), unit: unit, settime: settime});
			
			docs = datas;
			
			file.updateSync(shutterFile, datas);
		});
		
		
	}catch(e){
		log.error(e);
	}
};

//read synchronous
var read = function(callback){
	try{
		if(docs != undefined)
			callback(null, docs);
		
		file.readSync(sprinklerFile, function(err, readDocs){
			//메모리상의 데이터를 업데이트 한다.
			docs = readDocs;
			callback(err, docs);
		});
	}catch(e){
		callback(e, null);
	}
};

module.exports = {
		update : update,
		read : read
};