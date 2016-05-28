var SerialPort = require("serialport").SerialPort,
	log4js = require('log4js');

/* Copyright (C) Heung-tae Kim - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Heung-tae Kim <heungtae@gmail.com>, May 2016
 */

var	log = log4js.getLogger('libs.usbSensor');
log.setLevel(config.loglevel);

var serialPort = new SerialPort(config.usbSensor.port, {
  baudrate: config.usbSensor.baudrate
}, false); // this is the openImmediately flag [default is true] 

var val = '';
var result = '';
var sensors =[];

serialPort.open(function (error) {
  if ( error ) {
	  log.debug('failed to open: '+error);
  } else {
    log.debug('open');
    serialPort.on('data', function(data) {
      val = val + data;
      if(val.indexOf('Lt', 10) >= 0){
          result = val.substring(0, val.indexOf('Lt', 10));
          result = result.replace(/\r\n+/g, ',');
          log.trace('result received: ' + result);
          
          if(result.length > 0){
        	  var datas = result.split(',');
        	  
        	  for(id in datas){
        		  if(datas[id].indexOf(':') > 0){
        			  var vals = datas[id].split(':');
        			  sensors[vals[0]] = vals[1];
        		  }
        	  }
          }
          
          val = val.substring(val.indexOf('Lt', 10));
          log.trace('val remained: ' + val);
      }
    });
    
  }
});

exports.value = function(id, callback){
	callback(sensors[id]);
}