/**
 * http://usejsdoc.org/
 */
//============================config end =============================
//
var Commands = {"OFF": "off", "ON": "on", "AUTO": "auto"};
var Directions = {"OPEN": "open", "CLOSE": "close"};

var shutters = [
                {
                	side : 'Top',
                	position : 'First',
                	alias : '천창-1중',
                	autopriority : 3,
                	step : 0,
                	openpinnumber : 40,
                	closepinnumber : 38,
                	length : 60,
                	stepNum : 2,
                	motorrpm : 4, 
                	movelength : 12,
                	runtime : 0
                },
                {
                	side : 'Bottom',
                	position : 'First',
                	alias : '측창-1중',
                	autopriority : 4,
                	step : 0,
                	openpinnumber : 36,
                	closepinnumber : 37,
                	length : 140,
                	stepNum : 5,
                	motorrpm : 4, 
                	movelength : 12,
                	runtime : 0
                },
                {
                	side : 'Top',
                	position : 'Second',
                	alias : '천창-2중',
                	autopriority : 1,
                	step : 0,
                	openpinnumber : 32,
                	closepinnumber : 22,
                	length : 250,
                	stepNum : 5,
                	motorrpm : 4, 
                	movelength : 12,
                	runtime : 0
                },
                {
                	side : 'Bottom',
                	position : 'Second',
                	alias : '측창-2중',
                	autopriority : 2,
                	step : 0,
                	openpinnumber : 35,
                	closepinnumber : 33,
                	length : 140,
                	stepNum : 5,
                	motorrpm : 4, 
                	movelength : 12,
                	runtime : 0
                }          
                ];

var defaultSettime = 10;

var sprinklers = [
                  {
                	  unit : 'pump',
                	  alias : '관수 펌프',
                	  baseunit : true,
                	  settime : defaultSettime,
                	  runtime : 0,
                	  pinnumber : 12
                  },
                  {
                      unit : "firstvalve",
                      alias : '소품 벨브',
                      baseunit : false,
                      settime : defaultSettime,
                      runtime : 0,
                      pinnumber : 15
	              },
	              {
	                  unit : "secondvalve",
	                  alias : '중품 벨브',
	                  baseunit : false,
	                  settime : defaultSettime,
	                  runtime : 0,
	                  pinnumber : 13
	              },
	              {
	                  unit : "thirdvalve",
	                  alias : '송백 벨브',
	                  baseunit : false,
	                  settime : defaultSettime,
	                  runtime : 0,
	                  pinnumber : 11
	              }           
                ];

var Environment = [
                   {
                	   unit : 'Temperature',
                	   zone : 'Outside',
                	   alias : '외부 온도',
                	   type : 'number',
                	   connect : 'gpio',
                	   param : '28-03157454e5ff',
                	   defaultvalue : 0,
                	   standardUnit : '℃',
                	   use: {
                		   shutter : true,
                		   sprinkler : false,
                		   temperature : false
                	   }
                	   
                   },
                   {
                	   unit : 'Temperature',
                	   zone : 'Inside',
                	   alias : '내부 온도',
                	   type : 'number',
                	   connect : 'zigbee',
                	   param : 'At',
                	   defaultvalue : 0,
                	   standardUnit : '℃',
                	   use: {
                		   shutter : true,
                		   sprinkler : false,
                		   temperature : true
                	   }
                	   
                   },
                   {
                	   unit : 'Temperature',
                	   zone : 'Soil',
                	   alias : '토양 온도',
                	   type : 'number',
                	   connect : 'zigbee',
                	   param : 'Lt',
                	   defaultvalue : 0,
                	   standardUnit : '℃',
                	   use: {
                		   shutter : false,
                		   sprinkler : false,
                		   temperature : false
                	   }
                	   
                   }
                   ,
                   {
                	   unit : 'Humidity',
                	   zone : 'Inside',
                	   alias : '내부 습도',
                	   type : 'number',
                	   connect : 'zigbee',
                	   param : 'Ah',
                	   defaultvalue : 0,
                	   standardUnit : '%',
                	   use: {
                		   shutter : false,
                		   sprinkler : true,
                		   temperature : false
                	   }
                   },
                   {
                	   unit : 'Moisture',
                	   zone : 'Soil',
                	   alias : '토양 습도',
                	   type : 'number',
                	   connect : 'zigbee',
                	   param : 'Lh',
                	   defaultvalue : 0,
                	   standardUnit : '%',
                	   use: {
                		   shutter : false,
                		   sprinkler : true,
                		   temperature : false
                	   }
                   },
                   {
                	   unit : 'Rain',
                	   zone : 'Inside',
                	   alias : '내부 레인',
                	   type : 'number',
                	   connect : 'zigbee',
                	   param : 'Ra',
                	   defaultvalue : 0,
                	   standardUnit : '',
                	   use: {
                		   shutter : false,
                		   sprinkler : false,
                		   temperature : false
                	   }
                   },
                   {
                	   unit : 'Light',
                	   zone : 'Inside',
                	   alias : '일사',
                	   type : 'number',
                	   connect : 'zigbee',
                	   param : 'Li',
                	   defaultvalue : 0,
                	   standardUnit : '',
                	   use: {
                		   shutter : true,
                		   sprinkler : true,
                		   temperature : false
                	   }
                   }];
//============================config end =============================
var log = require('log4js').getLogger('ghConfig');




var getShutterConfig = function(callback){
	callback(shutters);
};

var getSprinklerConfig = function(callback){
	callback(sprinklers);
};

var getEnvironmentConfig = function(sys, callback){
	if(sys === null){
		log.trace('sys === null : ' + JSON.stringify(Environment));
		callback(Environment);		
	}else{
		try{
			var result = [];
			for(var i =0; i < Environment.length; i++ ){
				var env = Environment[i];
				
				if(env.use[sys])
					result.push(env);
			}

			log.trace(sys + ' ' + JSON.stringify(result));
			callback(result);
			
		}catch(e){
			console.error(e);
		}
	}
};

module.exports = {
		getShutterConfig: getShutterConfig,
		getSprinklerConfig: getSprinklerConfig, 
		getEnvironmentConfig: getEnvironmentConfig,
		Commands : Commands,
		Directions : Directions
		};
