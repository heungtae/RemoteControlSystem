var file = require('./file'),
	log = require('log4js').getLogger('libs.store.emergencyControl');

var emergencyControlFile = './datas/emergencyControl.dat';
var docs;

//sync write
//delete는 id를 제외한 모든 데이터를 삭제하는 것으로 진행한다.
var update = function(updateDocs){
	//메모리상의 데이터를 업데이트 한다.
	docs = updateDocs;
	file.updateSync(emergencyControlFile, docs);
};

//sync read
var read = function(callback){
	try{
		if(docs != undefined && docs != null)
			callback(null, docs);
		
		file.readSync(emergencyControlFile, function(err, readDocs){
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