var sleep = require('../libs/sleep'),
	ghConfig = require('../ghConfig'),
	db = require('../libs/db/shutter'),
	history = require('../libs/db/history'),
	log = require('log4js').getLogger('routes.shutter');
	send = require('../libs/telegram/send');

// 실행 중인 List
var executingTasks = {};
var socket,
	intervalId;

// 초기화를 진행하자.
var device;

if(config.app.shutter.device == 'gpio')
	device = require('../libs/gpio');
else
	device = require('../libs/usbRelay');

module.exports = function(io){
	try{
		log.info('setting server.io');
		
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

// shutters docs을 반환 한다.
module.exports.data = function(req, res){
	db.get(function(err, docs){
		res.render('shutter', {
			title : config.app.title.shutter,
			shutters: docs
		});
	});
};

var update = module.exports.updateJob = function(data, callback){
	log.debug("[Update] " + JSON.stringify(data));
	
	addExecutingTask(data, function(play, data){
    	log.debug('[update] device play = ' + play + ' ' + JSON.stringify(data));
    	
    	if(play){
    		//db의 step과 요청하는 step의 차이를 이용해서 open인지, close인지를 파악하고, time을 계산 한다.
    		if( intervalId === undefined)
    			intervalId = setInterval(executeTasks, 1000);
    		
    		log.debug('[update] setInterval : ' + JSON.stringify(intervalId) + '\n' + JSON.stringify(data));
    		
    		log.debug('[update] ' + data.conf.alias + ' ' + config.app.shutter.defaultCommand + ': pin= ' + data.stoppin);
    		
    		device.exec(data, config.app.shutter.defaultCommand, data.stoppin, function(err, key, value){
    			log.debug('[update] ' + data.config.alias + ' ' + config.app.shutter.defaultCommand + ': pin= ' + data.stoppin + ', value= ' + value);
    			
    			if(data.command != config.app.shutter.defaultCommand && value != -1 ){    		
    				log.debug('[update] ' + "sleeping......");
    				sleep.sleep(config.app.shutter.defaultSleep);
    			}
    			
    			device.exec(data, 'on', data.playpin, function(err, key, value){
    				log.debug('[update] ' + data.conf.alias + ' on : pin= ' + data.playpin + ', value= ' + value);
    				send.message(data.conf.alias + '가 ' + data.stepDesc + '로 이동을 시작했습니다. \n' + (data.settime / 60) + '분 동안 수행 됩니다.\n 시스템 제어 결과값 :' + (value == -1 ? 'fail' : 'success'));
					
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

var addExecutingTask = function(data, callback){
	var side = data.side,
     	position = data.position,
     	step = data.step;
    
    var location = side + '-' + position;
    data.location = location;

    var executingTask = executingTasks[location];
    
    if(data.command == ghConfig.Commands[config.app.shutter.defaultCommand.toUpperCase()]){
    	getConfig(data, function(shutterConf, data){
    		data.playpin = shutterConf.closepinnumber;
    		data.stoppin = shutterConf.openpinnumber;
			
    		executingTasks[location] = data;
    		callback(true, data);
    	});
    }else if(data.command == ghConfig.Commands.ON && executingTask === undefined || executingTask.step != step){
    	actionData(data, function(play, data){
    		log.debug('[addExecutingTask] ' + play + ': ' + JSON.stringify(data));
    
    		if(play){
    			executingTasks[location] = data;
    			callback(true, data);    			
    		}else{
    			callback(false, null);
    		}
    	})
    }else if(data.command == ghConfig.Commands.AUTO && executingTask === undefined){
    		log.debug('[addExecutingTask] ' + JSON.stringify(data));
    		executingTasks[location] = data;
    		callback(true, data);    			
    }else{
    	callback(false, null);
    }
    
};

var actionData = function(data, callback){
	try{
		var conf, val;

		getConfig(data, function(shutterConf){
			conf = shutterConf;
			
			db.getShutter(data, function(err, doc){
				var stepLength = conf.length / conf.stepNum;
				data.doc = doc;
				
				if(data.step == 0){
					data.settime = Math.round(conf.length/(conf.movelength * conf.motorrpm) * 60 + 30);
					data.exectime = 0;
					data.playpin = conf.closepinnumber;
					data.stoppin = conf.openpinnumber;
					data.stepDesc = '최대 닫기';
					data.command = ghConfig.Commands.ON;
					data.direction = ghConfig.Directions.CLOSE;
					callback(true, data);
				}else if(data.step > conf.stepNum){
					data.settime = Math.round(conf.length/(conf.movelength * conf.motorrpm) * 60 + 30);
					data.exectime = 0;
					data.playpin = conf.openpinnumber;
					data.stoppin = conf.closepinnumber;
					data.stepDesc = '최대 열기';
					data.command = ghConfig.Commands.ON;
					data.direction = ghConfig.Directions.OPEN;
					callback(true, data);
				}else{
					
					var stepTime = Math.round(( stepLength * data.step ) / (conf.movelength * conf.motorrpm) * 60);
					var settime = Math.abs(stepTime - doc.runtime);
					log.debug('[actionData] ' + JSON.stringify(doc));
					log.debug('step=' + data.step + ' stepTime=' + stepTime + ' settime=' + settime);
					data.stepDesc = data.step + ' 단계';
					
					if(stepTime > doc.runtime){
						data.settime = settime;
						data.exectime = 0;
						data.playpin = conf.openpinnumber;
						data.stoppin = conf.closepinnumber;
						data.command = ghConfig.Commands.ON;
						data.direction = ghConfig.Directions.OPEN;
						callback(true, data);
					}else if(stepTime < doc.runtime){
						data.settime = settime;
						data.exectime = 0;
						data.playpin = conf.closepinnumber;
						data.stoppin = conf.openpinnumber;
						data.command = ghConfig.Commands.ON;
						data.direction = ghConfig.Directions.CLOSE;
						callback(true, data);
					}else{
						callback(false, null);
					}
					
					
				}
			});
		});
		
	}catch(e){
		log.error(e);
		callback(false, null);
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
		
		callback(conf, data);
	});
	
}

var executeTasks = function(){
	try{
		log.trace('executeList length : ' + Object.keys(executingTasks).length);
		
		for (var location in executingTasks) {
	        if (executingTasks.hasOwnProperty(location)) {
	        	var data = executingTasks[location];
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
						
						
						
					}else{
						command = config.app.shutter.defaultCommand;
						data.exectime = 0;
						data.settime = 0;
						
						//해당 playpin을 off한다.
						device.exec(location, command, playpin, function(err, key, value){
							log.debug(key + ' ' + command + ' ' + playpin + ': result= ' + value);
							var completedConfig = executingTasks[key];
							delete executingTasks[key];
							
							if(completedConfig.step == 0)
								completedConfig.doc.runtime = 0;
							
							db.update(data.doc, function(err, result){});
							
							log.debug(executingTasks);							
							
							send.message('창 '+ key + '가 ' + completedConfig.step + '단계로 이동했습니다.\n System 제어 결과값 :' + (value == -1 ? 'fail' : 'success'));
							
							if(socket != null)
								socket.emit('shutterCallback', {location: key, command:command, settime:0, exectime:0});
							
						});
						
					}
					
				
				}else{
					delete executingTasks[location];
					db.update(data.doc, function(err, result){});
					
					log.debug(executingTasks);
					
					if(socket != null)
						socket.emit('shutterCallback', {location: location, command:config.app.shutter.defaultCommand, settime:100, exectime: 0});
				}
	        	
	        }
	    }
		
	}catch(e){
		log.error(e);
	}
};
