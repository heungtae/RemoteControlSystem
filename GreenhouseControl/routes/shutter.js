//var humidity = require('./humidity');
var sleep = require('../libs/sleep'),
	ghConfig = require('../ghConfig'),
	shutterData = require('../libs/db/shutter'),
	history = require('../libs/db/history'),
	log4js = require('log4js'),
	send = require('../libs/telegram/send');

var log = log4js.getLogger('routes.shutter');
log.setLevel(config.loglevel);

var executeList = {};
var socket,
	intervalId;
// 초기화를 진행하자.
var device;

if(config.app.shutter.device == 'gpio')
	device = require('../libs/gpio');
else
	device = require('../libs/usbRelay')

module.exports = function(io){
	try{
		console.log('setting shutter server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			// shutter socket function
			socket.on('shutterAction', function(data){
				log.debug(data);
				update(data, function(){
					log.debug('Starting shutter action');
				});
			});
			
		});		
	}catch(e){
		log.error(e);
	}	
};



module.exports.data = function(req, res){
	shutterData.get(function(err, docs){
		res.render('shutter', {
			title : config.app.title.shutter,
			shutters: docs
		});
	});
};

var update = module.exports.updateJob = function(data, callback){
	log.debug("Update : " + JSON.stringify(data));
	
    addList(data, function(play){
    	log.debug('device play = ' + play + ' ' + JSON.stringify(data));
    	
    	if(play){
    		//db의 step과 요청하는 step의 차이를 이용해서 open인지, close인지를 파악하고, time을 계산 한다.
    		if( intervalId === undefined)
    			intervalId = setInterval(checkShutterAction, 1000);
    		
    		log.debug('setInterval : ' + intervalId);
    		log.debug(data);
    		
    		device.exec(data, config.app.shutter.defaultCommand, data.stoppin, function(err, key, value){
    			log.debug(data.alias + ' ' + config.app.shutter.defaultCommand + ': pin= ' + data.stoppin + ', value= ' + value);
    			
    			if(data.command != config.app.shutter.defaultCommand && value != -1 ){    		
    				log.debug("sleeping......");
    				sleep.sleep(config.app.shutter.defaultSleep);
    			}
    			
    			device.exec(data, 'on', data.playpin, function(err, key, value){
    				log.debug(data.alias + ' on : pin= ' + data.playpin + ', value= ' + value);
    				send.message(data.alias + '가 ' + data.stepDesc + '로 이동을 시작했습니다. \n' + data.settime + '초 동안 수행 됩니다.\n 시스템 제어 결과값 :' + (value == -1 ? 'fail' : 'success'));
					
    				if(data.command != config.app.shutter.defaultCommand){
    					shutterData.update(data, function(err, result){
    						history.insert('Shutter', data);
    						callback(err, result);
    					});
    				}
    			});
    		});
    	}else{
    		callback();
    	}
    });
	
};



var addList = function(data, callback){
	var side = data.side,
     	position = data.position
     	step = data.step;
    
    var location = side + '-' + position;
    var wasData = executeList[location];
    data.location = location;
    
    if(data.command == config.app.shutter.defaultCommand ){
    	getConfig(data, function(shutterConf){
    		data.playpin = shutterConf.closepinnumber;
			data.stoppin = shutterConf.openpinnumber;
			
    		executeList[location] = data;
    		callback(true);
    	});
    }else if(wasData === undefined || wasData.step != step){
    	checkCommand(data, function(play){
    		log.debug(play + ': ' + JSON.stringify(data));
    
    		if(play){
    			executeList[location] = data;
    			callback(true);    			
    		}else{
    			callback(false);
    		}
    	})
    }else{
    	callback(false);
    }
    
};

var getConfig = function(data, callback){
	
	ghConfig.getShutterConfig(function(docs){
		log.debug('found shutter documents: count= ' + docs.length);
		
		var conf;
		for(var i =0; i < docs.length; i ++){
			val = docs[i];
			
			log.trace(val);
			if(val.side === data.side && val.position === data.position){
				conf = val;
				log.trace('found config');
				log.trace(conf);
				break;
			} 
		}
		
		callback(conf);
	});
	
}
var checkCommand = function(data, callback){
	try{
		var conf, val;

		getConfig(data, function(shutterConf){
			conf = shutterConf;
			
			shutterData.getShutter(data, function(err, doc){
				var stepLength = conf.length / conf.stepNum;
				data.doc = doc;
				
				if(data.step == 0){
					data.settime = Math.round(conf.length/(conf.movelength * conf.motorrpm) * 60 + 30);
					data.exectime = 0;
					data.playpin = conf.closepinnumber;
					data.stoppin = conf.openpinnumber;
					data.stepDesc = '최대 닫기';
					data.command = 'on';
					data.direction = 'close';
					callback(true);
				}else if(data.step > conf.stepNum){
					data.settime = Math.round(conf.length/(conf.movelength * conf.motorrpm) * 60 + 30);
					data.exectime = 0;
					data.playpin = conf.openpinnumber;
					data.stoppin = conf.closepinnumber;
					data.stepDesc = '최대 열기';
					data.command = 'on';
					data.direction = 'open';
					callback(true);
				}else{
					var stepTime = Math.round(( stepLength * data.step ) * (conf.movelength * conf.motorrpm) * 60);
					var settime = Math.abs(stepTime - doc.runtime);
					log.debug(doc);
					log.debug('stepLength= ' + stepLength + ', stepVal=' + stepVal);
					data.stepDesc = data.step + ' 단계';
					
					if(stepTime > doc.runtime){
						data.settime = settime;
						data.exectime = 0;
						data.playpin = conf.openpinnumber;
						data.stoppin = conf.closepinnumber;
						data.command = 'on';	
						data.direction = 'open';
						callback(true);
					}else if(stepTime < doc.runtime){
						data.settime = settime;
						data.exectime = 0;
						data.playpin = conf.closepinnumber;
						data.stoppin = conf.openpinnumber;
						data.command = 'on';
						data.direction = 'close';
						callback(true);
					}else{
						callback(false);
					}
					
					
				}
			});
		});
		
	}catch(e){
		log.error(e);
		callback(false);
	}
};


var checkShutterAction = function(){
	try{
		log.trace('executeList length : ' + Object.keys(executeList).length);
		
		for (var location in executeList) {
	        if (executeList.hasOwnProperty(location)) {
	        	var data = executeList[location];
				var command = data.command;
				
				log.trace(location + ': ' + command + ', ' + data.settime + ', ' + data.exectime);
				
				if(command != config.app.shutter.defaultCommand){
					var settime = data.settime;
					var exectime = data.exectime;
					var playpin = data.playpin;
					
					if(settime > exectime){
						data.exectime = exectime + 1;
						
						if(socket != null)
							socket.emit('shutterCallback', {location: location, command:command, settime:settime, exectime: exectime});
						
						if(data.direction == 'open')
							data.doc.runtime += 1;
						else
							data.doc.runtime -= 1;
						
						shutterData.update(data.doc, function(err, result){});
						
					}else{
						command = config.app.shutter.defaultCommand;
						data.exectime = 0;
						data.settime = 0;
						
						//해당 playpin을 off한다.
						device.exec(location, command, playpin, function(err, key, value){
							log.debug(key + ' ' + command + ' ' + playpin + ': result= ' + value);
							var completedConfig = executeList[key];
							delete executeList[key];
							
							log.debug(executeList);							
							send.message('창 '+ key + '가 ' + completedConfig.step + '단계로 이동했습니다.\n System 제어 결과값 :' + (value == -1 ? 'fail' : 'success'));
							
							if(socket != null)
								socket.emit('shutterCallback', {location: key, command:command, settime:0, exectime:0});
							
						});
						
					}
					
				
				}else{
					delete executeList[location];
					console.log(executeList);
					
					if(socket != null)
						socket.emit('shutterCallback', {location: location, command:config.app.shutter.defaultCommand, settime:100, exectime: 0});
				}
	        	
	        }
	    }
		
	}catch(e){
		log.error(e);
	}
};