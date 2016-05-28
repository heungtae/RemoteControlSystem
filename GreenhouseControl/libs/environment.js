/**
 * http://usejsdoc.org/
 */

var	rpiTemp = require('rpi-temp-module'),
	log4js = require('log4js');
var sensors;

if (config.development) {
	sensors = require('../develop/usbSensor');
}else{
	sensors = require('./usbSensor');	
}


var	log = log4js.getLogger('libs.environment');
log.setLevel(config.loglevel);

exports.value = function(conf, callback) {
	try{
		if(conf.value == undefined)
			conf.value = conf.defaultvalue;
		
		
		if(conf.connect == 'gpio'){
			rpiTemp.getTemperature(conf.param, function(err, value){ 
				if(err == null){
					log.debug("[value] Temperature: value= " + value );
					
					if(value > 50 || value < -30)
						value = 0;
					
					value = Math.round(value * 10) / 10;
					
					if(Math.abs(conf.value - value) < 30)
						conf.value = value;
					
				}

				callback(null, conf);
			});
		}else if(conf.connect == 'zigbee'){
			sensors.value(conf.param, function(val){
				conf.value = val;
				callback(null, conf);
			})
		}else{
			log.debug('[value] ' + JSON.stringify(conf));
			callback(null, conf);
		}
	} catch(e){
		log.error(e);
		callback(e, conf);
	}
};
