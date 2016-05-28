/* Copyright (C) Heung-tae Kim - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Heung-tae Kim <heungtae@gmail.com>, May 2016
 */

var SerialPort = require("serialport").SerialPort,
	log4js = require('log4js');

var	log = log4js.getLogger('libs.usbRelay');
log.setLevel(config.loglevel);

var serialPort = new SerialPort(config.usbRelay.port, {
  baudrate: config.Relay.baudrate
}, false); // this is the openImmediately flag [default is true] 

var val = '';
var result = '';
var sensors =[];

serialPort.open(function (err) {
  if ( err ) {
	  log.debug('failed to open: '+err);
  } else {
    log.debug('open');    
  }
});

exports.exec = function(doc, action, pinNumber, callback){
	try{		
		if(action == "on"){
			on(pinNumber, function(err, value){
				callback(err, doc, value);
			});
		}else{ // off
			off(pinNumber, function(err, value){
				callback(err, doc, value);
			});
		}
	}catch(e){
		log.error(e);
		callback(e, doc, -1);
	}
};

var on = function(id, callback){
	serialPort.write('relay on ' + pinNumber + '\r', function(err, results){
		if ( error ) {
			log.debug('failed to open: '+error);
		} 
		
		callback(err, results);
	});
}

var off = function(id, callback){
	serialPort.write('relay off ' + pinNumber + '\r', function(err, results){
		if ( error ) {
			log.debug('failed to open: '+error);
		} 
		
		callback(err, results);
	});
}