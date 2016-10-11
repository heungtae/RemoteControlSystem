var file = require('./file'),
	log = require('log4js').getLogger('libs.store.shutter');

var shutterFile = './datas/shutter.dat';
var docs;

var update = function(side, position, step, runtime){
	try{
		
		read(function(err, datas){
			step = step === undefined ? 0 : step;
			runtime = runtime === undefined ? 0 : runtime;
			
			var count = 0;
			for(var key in datas) {
				if( datas[key].side === side && datas[key].position === position ){
					datas[key].date = new Date();
					datas[key].step = step;
					datas[key].runtime = runtime;
					count++;
					break;
				}
			}	
			
			if(count === 0){
				var obj = {date: new Date(), side: side, position: position, step: step, runtime: runtime};
				
				datas.push(obj);
			}
			
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
		if(docs != undefined && docs != null)
			callback(null, docs);
		
		
		
		file.readSync(shutterFile, function(err, readDocs){
			log.info(readDocs);
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