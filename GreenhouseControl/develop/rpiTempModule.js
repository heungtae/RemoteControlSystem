/**
 * http://usejsdoc.org/
 */
var log = require('log4js').getLogger('develop.usbSensor');

var val = 1;
exports.getTemperature = function(id, callback){
	val++;
	
	log.trace('[value] ' + id + '=' + val);
	
	callback(val);
}