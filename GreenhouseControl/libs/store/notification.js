var file = require('./file'),
	log = require('log4js').getLogger('libs.store.notification');

var notificationFile = './datas/notification.dat';
var docs;

var update = function(updateDocs){
	//메모리상의 데이터를 업데이트 한다.
	docs = updateDocs;
	file(notificationFile, docs);
};

var read = function(callback){
	try{
		if(docs != undefined && docs != null)
			callback(null, docs);
		
		file.readSync(notificationFile, function(err, readDocs){
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