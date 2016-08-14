const fs = require('fs');
var log = require('log4js').getLogger('libs.store.temperatureControl');

var temperatureControlFile = './datas/temperatureControl.dat';


var file = require('file'),
log = require('log4js').getLogger('libs.store.temperatureControl');

var temperatureControlFile = './datas/temperatureControl.dat';
var docs;

var update = function(updateDocs){
//메모리상의 데이터를 업데이트 한다.
	docs = updateDocs;
	file(temperatureControlFile, docs);
};

var read = function(callback){
	try{
		if(docs != undefined)
			callback(null, docs);
		
		file.readSync(temperatureControlFile, function(err, readDocs){
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