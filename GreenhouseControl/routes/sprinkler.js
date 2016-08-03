//var humidity = require('./humidity');
var ghConfig = require('../ghConfig'),
	sprinklerData = require('../libs/db/sprinkler'),
	history = require('../libs/db/history'),
	log = require('log4js').getLogger('routes.sprinkler');
	send = require('../libs/telegram/send');

var executeList = {};
var socket, 
	intervalId;
//초기화를 진행하자.
var device;

if(config.app.shutter.device == 'gpio')
	device = require('../libs/gpio');
else
	device = require('../libs/usbRelay')
	
module.exports = function(io){
	try{
		log.info('setting server.io');
		
		io.sockets.on('connection', function(connection){
			socket = connection;
			log.debug('Connection socket');
			
			
			// sprinkler socket function
			socket.on('sprinklerAction', function(data){
				update(data, function(){
					log.debug('Starting sprinkler action');
				});
			});
		});		
	}catch(e){
		log.error(e);
	}	
};


module.exports.data = function(req, res){
	sprinklerData.get(function(err, docs){
		res.render('sprinkler', {
			title : config.app.title.sprinkler,
			sprinklers: docs
		});
	});
};

var addList = function(data, callback){
    
    getConfig(data, function(sprinklerConf){
    	var unit = data.unit;
    	var wasData = executeList[unit];
    	log.debug(sprinklerConf);
	
		data.pin = sprinklerConf.pinnumber;
		
		log.debug(data);
		if(data.command == config.app.sprinkler.defaultCommand ){
			executeList[unit] = data;
			callback(true);
		}else if(wasData === undefined || wasData.command != data.command){
			executeList[unit] = data;
			callback(true);
		}else{
			callback(false);
		}

    });
    
    
};


var getConfig = function(data, callback){
	
	ghConfig.getSprinklerConfig(function(docs){
		log.debug('found shutter documents: count= ' + docs.length);
		
		var conf;
		for(var key in docs){
			var val = docs[key];
			
			log.trace(val);
			if(val.unit === data.unit.trim()){
				conf = val;
				log.trace('found config');
				log.trace(conf);
				break;
			} 
		}
		
		callback(conf);
	});
	
}

var update = module.exports.updateJob = function(data, callback){
	log.debug("command = " + data.command + " pin= " + data.pin);
    
    addList(data, function(play){
    	log.debug('device play = ' + play);
    	
    	if(play){
    		log.debug(data);
    		
    		if( intervalId === undefined)
    		intervalId = setInterval(checkSprinklerAction, 1000);
    		
			device.exec(data.unit, data.command, data.pin, function(err, key, value){
				log.debug(key + ' ' + data.command + ': device pin= ' + data.pin + ', value= ' + value);
				
				if(data.command != config.app.sprinkler.defaultCommand)
					send.message('관수용 '+ key + '를 ' + data.settime + '분 동안 실행합니다. \n System 제어 결과값 :' + (value == -1 ? 'fail' : 'success'));
				else
					send.message('관수용 '+ key + '를 중지 했습니다. \n System 제어 결과값 :' + (value == -1 ? 'fail' : 'success'));
				
				if(data.command != config.app.sprinkler.defaultCommand){
					sprinklerData.update(data, function(err, result){
						callback(err, result);
						history.insert('Sprinkler', data);
					});
				}
			});
    	}else{
    		callback();
    	}
    });
	
};


var checkSprinklerAction = function(){
	try{
		
		log.trace('executeList length : ' + Object.keys(executeList).length);
		
		for (var unit in executeList) {
			if (executeList.hasOwnProperty(unit)) {
				data = executeList[unit];
				var command = data.command;
				
				log.trace(unit + ': ' + command + ', ' + data.settime + ', ' + data.exectime);
				
				if(command != config.app.sprinkler.defaultCommand){
					var settime = data.settime * 60;
					var exectime = data.exectime;
					var pin = data.pin;
					
					if(settime > exectime){
						data.exectime = exectime + 1;
						
						if(socket != null)
							socket.emit('sprinklerCallback', {unit: unit, command:command, settime:settime, exectime: exectime});
					}else{
						command = config.app.sprinkler.defaultCommand;
						//data.exectime = 0;
						data.settime = 0;
						
						//해당 pin을 off한다.
						device.exec(unit, command, pin, function(err, key, value){
							log.debug(pin + ': value= ' + value);
							var completedConfig = executeList[key];
							delete executeList[key];
							
							log.debug(executeList);
							
							send.message('관수용 '+ key + '를 ' + (completedConfig.exectime/60) + '분 동안 실행했습니다. \n System 제어 결과값 :' + (value == -1 ? 'fail' : 'success'));
							
							if(socket != null)
								socket.emit('sprinklerCallback', {unit: unit, command:command, settime:0, exectime: 0});
						});
						
					}
					
					
					
				}else{
					delete executeList[unit];
					console.log(executeList);
					
					if(socket != null)
						socket.emit('sprinklerCallback', {unit: unit, command:config.app.sprinkler.defaultCommand, settime:0, exectime: 0});
				}
			}
		}
	}catch(e){
		log.error(e);
	}
};
