var file = require('./file'),
	log = require('log4js').getLogger('libs.store.scheduleShutter');

var scheduleShutterFile = './datas/scheduleShutter.dat';
var docs;
//delete는 id를 제외한 모든 데이터를 삭제하는 것으로 진행한다.
//write synchronous
var update = function(updateDocs){
	docs = updateDocs;
	file.updateSync(scheduleShutterFile, docs);
};

//read synchronous
var read = function(callback){
	try{
		if(docs != undefined && docs != null)
			callback(null, docs);
		
		file.readSync(scheduleShutterFile, function(err, readDocs){
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