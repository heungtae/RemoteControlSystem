var CronJob = require('cron').CronJob,
	scheduleStore = require('../db/scheduleShutter'),
	temperatureControlStore = require('../db/temperatureControl'),
	emergencyControlStore = require('../db/emergencyControl'),
	env = require('../db/environment'),
	ghConfig = require('../../ghConfig'),
	shutter = require('../../routes/shutter'),
	sleep = require('../sleep'),
	log = require('log4js').getLogger('libs.job.scheduleShutter'),
	send = require('../telegram/send');

var jobCompletedList = [];
var jobExecuteList = [];

// 1. 실행 시간의 구간안에 포함되는지 확인 한다.
// 1.1. 실행 시간이 아니라면 실행 중인 항목에 대해서 삭제 한다.
// 2. 실행 시간의 구간안에 실행 중인지를 확인 한다.
// 3. 환경값을 읽어와서 필요한 환경 값을 Setting 한다.
// 4. 실행 가능한지를 확인 한다.
// 5. 실행한다.

var job = new CronJob('*/1 * * * *', function() {
	try{	
		
		emergencyControlStore.get(function(err, emgDocs, confs){
			scheduleStore.get(function(err, schdocs, confs){
				temperatureControlStore.get(function(err, tempDocs, confs){
					//시간, 환경값, 실행 여부를 확인한다. 
					jobExecuteList = [];
										
					log.debug('[job] Emergency Control');
					for(var key in emgDocs){
						var doc = emgDocs[key];
						doc.category = 'emergency';
						doc.funcPriority = 1;
						getConfiguration(doc, confs, function(doc){
							checkTime(doc, function(doc){
								checkEnvironment(doc, function(doc){
									checkJobCompleted(doc, function(doc){
										if(doc.inTime && doc.isEnvironment && !doc.isJobCompleted ){
											checkPriority(doc, function(){
												
											});
										}
									});
								});
							});
						});
					}
					
					log.debug('[job] Schedule Control');
					for(var key in schdocs){
						var doc = schdocs[key];
						doc.category = 'schedule';
						doc.funcPriority = 2;
						
						getConfiguration(doc, confs, function(doc){
							checkTime(doc, function(doc){
								checkEnvironment(doc, function(doc){
									checkJobCompleted(doc, function(doc){
										if(doc.inTime && doc.isEnvironment && !doc.isJobCompleted ){
											checkPriority(doc, function(){
												
											});
										}
									});
								});
							});
						});							
					}
					
					log.debug('[job] Temperature Control');
					for(var key in tempDocs){
						var doc = tempDocs[key];
						doc.category = 'auto';
						doc.funcPriority = 3;
						
						getConfiguration(doc, confs, function(doc){
							checkTempTime(doc, function(doc){
								checkTempEnvironment(doc, function(doc){
									checkJobCompleted(doc, function(doc){
										if(doc.inTime && doc.isEnvironment && !doc.isJobCompleted ){
											checkPriority(doc, function(){
												
											});
										}
									});
								});
							});
						});							
					}					
					
					
					for(i = 0; i < jobExecuteList.length; i++){
						var doc = jobExecuteList[i];
						getConfiguration(doc, confs, function(doc){
							getStep(doc, function(step, stepDesc){
								var data = {
										side: doc.side.trim(),
										position: doc.position.trim(),
										step: step,
										settime: 0,
										exectime: 0,
										playpin: 0,
										stoppin: 0,
										command: ghConfig.Commands.ON,
										conf: doc.conf,
										envDesc: doc.envDesc
								};
								
								if(doc.category == 'auto'){
									data.settime =  doc.settime;
									data.direction = doc.direction;
									data.playpin = doc.playpin;
									data.stoppin = doc.stoppin;
									data.command = ghConfig.Commands.AUTO;
								}
								
								shutter.updateJob(data, function(){
									log.debug('[CronJob] ' + doc.title +'(' + doc.id + ') starting shutter: ' + JSON.stringify(data));	
									send.message(doc.title + '으로 예약된 창 제어를 시작했습니다. \n ' + doc.alias + '를 ' + stepDesc);
									jobCompletedList.push(doc.id);
								});
							});
						});
					}
					
					clearJobCompletedList(emgDocs);
					clearJobCompletedList(schdocs);
					clearJobCompletedList(tempDocs);
				});
			});
		});
	}catch(e){
		log.error(e);
	}
  },null,true
);

var checkTime = function(doc, callback){
	if(doc['start'] != undefined){
		var now = new Date(),
		start = new Date(),
		end = new Date();
		
		start.setHours(doc.start.substring(0, 2), doc.start.substring(3, 5), 00, 00);
		end.setHours(doc.end.substring(0, 2), doc.end.substring(3, 5), 59, 59);
		
		log.debug('[checkTime] ' + doc.title +'(' + doc.id + ') ' + ' : ' + start + ' ' + end);
		if(now.getTime() > start.getTime() && now.getTime() < end.getTime()){
			doc.inTime = true;
		}else{
			doc.inTime = false;
		}
		callback(doc);
	}
	else{
		doc.inTime = true;
		callback(doc);
	}
}


var checkEnvironment = function(doc, callback){
	
	var envCount = 0,
		check = 0,
		envDesc = '';
	
	ghConfig.getEnvironmentConfig(null, function(envResult){
		log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') Environment configuration length : ' + envResult.length);
		envResult.forEach(function(envConf){
			var unitKey = envConf.unit + '-' + envConf.zone;
			var operKey = envConf.unit + '-' + envConf.zone + '-Oper';
			
			
			if(doc[operKey] != undefined){
				envCount++;
				log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') ' + JSON.stringify(envConf));
					
				if(envConf.value != undefined){
					
					if(envConf.type == 'number'){
						if(doc[operKey] == '>'){
							if(envConf.value > parseInt(doc[unitKey])){
								check++;
								envDesc += envConf.alias + '값이 ' + envConf.value +  '로 설정값 ' + doc[unitKey] +  ' 보다 큼; \n';
							}
						} else {
							if(envConf.value < parseInt(doc[unitKey])){
								check++;
								envDesc += envConf.alias + '값이 ' + envConf.value +  '로 설정값 ' + doc[unitKey] +  ' 보다 작음; \n ';
							}
						}							

						log.trace('[checkEnvironment] number type environment' + doc.title +'(' + doc.id + ') Result envCount(' + envCount + ') = check(' + check + ') UnitKey: ' + unitKey + ' ' + doc[unitKey] + ' ' +  envConf.value + ' ' + doc[operKey] );
					}else if(envConf.type == 'boolean'){
						if(doc[operKey].trim() == 'true'){
							if(envConf.value){
								check++;
								envDesc += envConf.alias + '가 ' + envConf.value + '로 설정과 동일함; \n'; 
							}
						} else {
							if(!envConf.value){
								check++;
								envDesc += envConf.alias + '가 ' + envConf.value + '로 설정과 동일함; \n'; 
							}
						}	
					
						log.trace('[checkEnvironment] boolean type environment' + doc.title +'(' + doc.id + ') Result envCount(' + envCount + ') = check(' + check + ') UnitKey: ' + unitKey + ' ' +  envConf.value + ' = ' + doc[operKey]);
					}
					
				}
						
			}
		});
		
		if(envCount == check){
			doc.isEnvironment = true;
			doc.envDesc = envDesc;
		}else{
			doc.isEnvironment = false;
			doc.envDesc = envDesc;
		}
		
		callback(doc);
	});
}

var checkTempTime = function(doc, callback){
	
	checkTime(doc, function(doc){
		if(doc.inTime){
			var now = new Date();
			var next = new Date(now.getTime() + (doc.period * 1000 + doc.wait * 1000));

			log.trace('[checkTempTime] nextTempRuntime = ' + doc.conf.nextTempRuntime);
			
			if(doc.conf.nextTempRuntime == undefined){
				//nextTempRuntime이 없다는 것은 한번도 실행 되지 않았음으로 무조건 실행한다.
				doc.conf.nextTempRuntime = next;
			}else if(now.getTime() <= doc.conf.nextTempRuntime.getTime()){
				//현재 시간이 nextTempRuntime 보다 작으면 실행하면 안됨으로 inTime에서 false로 변경하여 반환 한다.
				doc.inTime = false;
			}
		}
	});
	
}

var checkTempEnvironment = function(doc, callback){
	
	var envCount = 0,
		check = 0, 
		setStep = 0,
		envDesc = '';

	ghConfig.getEnvironmentConfig(null, function(envResult){
		log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') Environment configuration length : ' + envResult.length);
		envResult.forEach(function(envConf){
			var targetKey = envConf.unit + '-' + envConf.zone + '-Target';
			var rangeKey = envConf.unit + '-' + envConf.zone + '-Range';
			
			log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') ' + JSON.stringify(envConf));
			
			if(doc[operKey] != undefined){
				envCount++;
				
				if(envConf.value != undefined){

					if(envConf.value > (parseInt(doc[targetKey]) + parseInt(doc[rangeKey]) ) ){
						check++;
						doc.settime = doc.period * 60;
						doc.direction = ghConfig.Directions.OPEN;
						doc.playpin = doc.conf.openpinnumber;
						doc.stoppin = doc.conf.closepinnumber;
						envDesc += envConf.alias + '값이 ' + envConf.value +  '로 설정값 ' + doc[unitKey] +  ' 보다 큼; \n';
					}else if(envConf.value < (parseInt(doc[targetKey]) - parseInt(doc[rangeKey]) ) ){
						check++;
						doc.settime = doc.period * 60;
						doc.direction = ghConfig.Directions.CLOSE;
						doc.playpin = doc.conf.closepinnumber;
						doc.stoppin = doc.conf.openpinnumber;
						envDesc += envConf.alias + '값이 ' + envConf.value +  '로 설정값 ' + doc[unitKey] +  ' 보다 작음; \n';
					}
					
					log.trace('[checkEnvironment] number type environment' + doc.title +'(' + doc.id + ') Result envCount(' + envCount + ') = check(' + check + ') targetKey: ' + targetKey + ' ' + doc[targetKey] + ' ' +  envConf.value + ' ' + doc[rangeKey] );
				}
						
			}
		});
		
		if(envCount == check){
			doc.isEnvironment = true;
			doc.envDesc = envDesc;
		}else{
			doc.isEnvironment = false;
			doc.envDesc = envDesc;
		}
		
		callback(doc);
	});
}

var checkJobCompleted = function(doc, callback){
	doc.isJobCompleted = jobCompletedList[doc.id] == undefined ? false : true;
	callback(doc);
}
		
var checkPriority = function(newDoc, callback){
	var unitKey = newDoc.side + '-' + newDoc.position;
	
	if(jobExecuteList[unitKey] == undefined){
		jobExecuteList[unitKey] = newDoc;
	}else{
		var doc = jobExecuteList[unitKey];
		//compare priority
		if(doc.funcPriority > newDoc.funcPriority || doc.priority > newDoc.priority){
			jobExecuteList[unitKey] = newDoc				
		}else{
			
			//compare environment value 
			var isSameKey;
			
			for(key in doc){
				if(key.endsWith('Value')){
					if(newDoc[key] == undefined){
						isSameKey = false;
						break;
					}
				}
			}
			
			if(isSameKey){
				for(key in doc){
					if(key.endsWith('Value')){
						var operKey = key.replace('Value', 'Oper');
						if(operKey == '>' && parseInt(doc[key]) < parseInt(newDoc[key])){
							jobExecuteList[unitKey] = newDoc;
						}else if(parseInt(doc[key]) > parseInt(newDoc[key])){
							jobExecuteList[unitKey] = newDoc;	
						}
					}
				}
			}
		}
	}
	
	callback();
}



var getStep = function(doc, conf, callback){
	
	try{
		var step = parseInt(doc.step.trim());
		
		if(step > doc.conf.stepNum){
			step = doc.conf.stepNum;
		}
	
		var stepDesc = (step == 0 ? '최대로 닫습니다.' : step == conf.stepNum ? '최대로 열겠습니다.' : step + ' 단계로 이동합니다.');
		
		log.debug('[getStep] ' + doc.title +'(' + doc.id + ') step :' + stepDesc);
		callback(step, stepDesc);
		
	}catch(e){
		log.error(e);
		callback(-1);
	}
	
};

var getConfiguration = function(doc, confs, callback){
	var conf;
	for(var i =0; i < confs.length; i ++){
		val = confs[i];
		if(val.side == doc.side.trim() && val.position == doc.position.trim()){
			conf = val;
			break;
		} 
	}
	
	doc.conf = conf;
	
	callback(doc, conf);
}

var clearJobCompletedList = function(docs){
	for(var key in docs){
		var doc = docs[key];
		
		if(!doc.inTime && jobCompletedList[doc.id] != undefined){			
			delete jobCompletedList[doc.id]; 
		}
	}
	
	log.trace('[clearJobCompletedList] Job Completed List :' + JSON.stringify(jobCompletedList));
}