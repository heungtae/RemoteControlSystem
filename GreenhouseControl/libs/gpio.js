/**
 * http://usejsdoc.org/
 */
var gpio,
	log4js = require('log4js');

var	log = log4js.getLogger('libs.gpio');

log.setLevel(config.loglevel);

try {
	gpio = require("pi-gpio");
} catch (e) {
	console.log(e);
}

exports.exec = function(doc, action, pinNumber, callback){
	try{		
		if(action == "on"){
			on(pinNumber, function(err, value){
				callback(err, doc, value);
			});
		}else{ //off
			off(pinNumber, function(err, value){
				callback(err, doc, value);
			});
		}
	}catch(e){
		log.error(e);
		callback(e, doc, -1);
	}
};

var on = function(pinNumber, callback){
    gpio.open(pinNumber, "output", function(err) {         // Open pin 16 for output
    	log.debug("gpio open: " + pinNumber );
    	
    	gpio.write(pinNumber, 0, function(err){
    		log.debug("gpio on: " + pinNumber );
    		if(err){
    			log.error(err);
    		}
    		
    		gpio.read(pinNumber, function(err, value) {
    			if(err){
    				log.debug(err);
    			}
    			callback(err, value);
    		});
    	});
    });
};

var off = function(pinNumber, callback){
	gpio.open(pinNumber, "output", function(err) {         // Open pin 16 for output
		log.debug("gpio open: " + pinNumber );
		gpio.write(pinNumber, 1, function(err){
			log.debug("gpio on: " + pinNumber );
			if(err){
				log.error(err);
			}
			
			gpio.read(pinNumber, function(err, value) {
				if(err){
					log.debug(err);
				}
				callback(err, value);
			});
		});
	});
};
