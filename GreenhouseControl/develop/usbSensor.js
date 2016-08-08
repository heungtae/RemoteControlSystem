var ghConfig = require('../ghConfig'),
	log = require('log4js').getLogger('develop.usbSensor');
	
var sensors =[];

ghConfig.getEnvironmentConfig(null, function(confs){
	
	var doc;
	for(idx in confs){
		doc = confs[idx];
		sensors[doc.param] = 1;
	};
	
});

exports.value = function(id, callback){
	sensors[id]++;
	
	log.trace('[value] ' + id + '=' + sensors[id])
	callback(sensors[id]);
}

