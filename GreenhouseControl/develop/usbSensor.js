var ghConfig = require('../ghConfig');
	
var sensors =[];

ghConfig.getEnvironmentConfig(null, function(confs){
	
	var doc;
	for(idx in confs){
		doc = confs[idx];
		sensors[doc.param] = idx;
	};
	
});

exports.value = function(id, callback){
	callback(sensors[id]);
}

