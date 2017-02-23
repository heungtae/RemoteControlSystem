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

var jobCompletedList = {};
var jobExecuteList = {};


// 1. 실행 시간의 구간안에 포함되는지 확인 한다.
// 1.1. 실행 시간이 아니라면 실행 중인 항목에 대해서 삭제 한다.
// 2. 실행 시간의 구간안에 실행 중인지를 확인 한다.
// 3. 환경값을 읽어와서 필요한 환경 값을 Setting 한다.
// 4. 실행 가능한지를 확인 한다.
// 5. 실행한다.

var job = new CronJob('*/10 * * * * *', function() {
	try{	
		
		emergencyControlStore.get(function(err, emgDocs, confs){
			scheduleStore.get(function(err, schdocs, confs){
				temperatureControlStore.get(function(err, tempDocs, confs){
					//시간, 환경값, 실행 여부를 확인한다. 
					jobExecuteList = {};
										
					log.debug('[job] Emergency Control');
					for(var key in emgDocs){
						var doc = emgDocs[key];
						doc.category = 'emergency';
						doc.funcPriority = 1;
						log.trace('[job] Emergency Control: ' + JSON.stringify(doc, null, 4));
						getConfiguration(doc, confs, function(doc){
							checkTime(doc, function(doc){
								checkEnvironment(doc, function(doc){
									checkJobCompleted(doc, function(doc){
										
										if(doc.inTime && doc.isEnvironment && !doc.isJobCompleted ){
											log.debug('[job] condition : ' + (doc.inTime && doc.isEnvironment && !doc.isJobCompleted));
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
						log.trace('[job] Schedule Control: ' + JSON.stringify(doc, null, 4));
						
						getConfiguration(doc, confs, function(doc){
							checkTime(doc, function(doc){
								checkEnvironment(doc, function(doc){
									checkJobCompleted(doc, function(doc){
										log.debug('[job] condition : ' + (doc.inTime && doc.isEnvironment && !doc.isJobCompleted));
										if(doc.inTime && doc.isEnvironment && !doc.isJobCompleted ){
											log.debug('[job] Execute doc : ' + JSON.stringify(doc));
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
						log.trace('[job] Temperature Control: ' + JSON.stringify(doc, null, 4));
						
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
					
					log.debug('[job] Execute List : ' + JSON.stringify(jobExecuteList, null, 4));
							
					for(var key in jobExecuteList){
						var doc = jobExecuteList[key];
						log.debug('[job] Execute doc : ' + JSON.stringify(doc, null, 4));
						
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
									log.debug('[job] ' + doc.title +'(' + doc.id + ') starting shutter: ' + JSON.stringify(data, null, 4));	
									send.message(doc.title + '으로 예약된 창 제어를 시작했습니다. \n '+ doc.alias.trim() + '를 ' + stepDesc + ' \n' + doc.envDesc);
									
									addJobCompletedList(doc);
								});
							});
						});
					};
					
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
		
		if(now.getTime() > start.getTime() && now.getTime() < end.getTime()){
			doc.inTime = true;
		}else{
			doc.inTime = false;
		}
		
		log.debug('[checkTime] result :' + doc.title +'(' + doc.id + ') : ' + ' inTime= ' + doc.inTime + ' now= ' + now + ' start=' + start + ' end=' + end);
		callback(doc);
	}
	else{
		doc.inTime = true;
		log.debug('[checkTime] result : start undefined, ' + doc.title +'(' + doc.id + ') inTime= true');
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
			var unitKey = envConf.unit + '-' + envConf.zone + '-Value';
			var operKey = envConf.unit + '-' + envConf.zone + '-Oper';
			
			if(doc[operKey] != undefined){
				envCount++;
				log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') unitKey=' + unitKey + ' operKey=' + operKey + ' value=' + envConf.value);
					
				if(envConf.value != undefined){
					
					if(envConf.type == 'number'){
						if(doc[operKey] == '>'){
							if(envConf.value > parseInt(doc[unitKey])){
								check++;
								envDesc += envConf.alias + '값이 ' + envConf.value +  '로 설정값 ' + doc[unitKey] +  ' 보다 큼; \n';
							}else{
								envDesc += envConf.alias + '값이 ' + envConf.value +  '로 설정값 ' + doc[unitKey] +  ' 보다 작음; \n';
							}
						} else {
							if(envConf.value < parseInt(doc[unitKey])){
								check++;
								envDesc += envConf.alias + '값이 ' + envConf.value +  '로 설정값 ' + doc[unitKey] +  ' 보다 작음; \n ';
							}else{
								envDesc += envConf.alias + '값이 ' + envConf.value +  '로 설정값 ' + doc[unitKey] +  ' 보다 큼; \n ';
							}
						}							

						log.trace('[checkEnvironment] number type environment : ' + doc.title +'(' + doc.id + ') Result envCount(' + envCount + ') = check(' + check + ') UnitKey: ' + unitKey + ' ' +  envConf.value + ' ' + doc[operKey] + ' ' + doc[unitKey] );
					}else if(envConf.type == 'boolean'){
						if(doc[operKey].trim() == 'true'){
							if(envConf.value){
								check++;
								envDesc += envConf.alias + '가 ' + envConf.value + '로 설정과 동일함; \n'; 
							}else{
								envDesc += envConf.alias + '가 ' + envConf.value + '로 설정과 비동일함; \n';
							}
						} else {
							if(!envConf.value){
								check++;
								envDesc += envConf.alias + '가 ' + envConf.value + '로 설정과 동일함; \n'; 
							}else{
								envDesc += envConf.alias + '가 ' + envConf.value + '로 설정과 비동일함; \n';
							}
						}	
					
						log.trace('[checkEnvironment] boolean type environment: ' + doc.title +'(' + doc.id + ') Result envCount(' + envCount + ') = check(' + check + ') UnitKey: ' + unitKey + ' ' +  envConf.value + ' = ' + doc[operKey]);
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
		
		log.debug('[checkEnvironment] result : ' + doc.title +'(' + doc.id + ') isEnvironment= ' + doc.isEnvironment + ' (' + doc.envDesc + ')');
		
		callback(doc);
	});
}

var checkTempTime = function(doc, callback){
	
	checkTime(doc, function(doc){
		//시간 설정이 되어 있는 경우만 주기 반복을 점검 한다.
		if(doc.inTime){
			var now = new Date();
			var next = new Date(now.getTime() + (doc.period * 1000 + doc.wait * 1000));
			
			if(doc.conf.nextTempRuntime == undefined){
				//nextTempRuntime이 없다는 것은 한번도 실행 되지 않았음으로 무조건 실행한다.
				doc.conf.nextTempRuntime = next;
				log.trace('[checkTempTime] first time, NextTempRuntime= ' + doc.conf.nextTempRuntime + ' now= ' + now);
			}else if(now.getTime() <= doc.conf.nextTempRuntime.getTime()){
				//현재 시간이 nextTempRuntime 보다 작으면 실행하면 안됨으로 inTime에서 false로 변경하여 반환 한다.
				doc.inTime = false;
				log.trace('[checkTempTime] inTime= False, NextTempRuntime= ' + doc.conf.nextTempRuntime + ' now= ' + now);
			}else if(now.getTime() > doc.conf.nextTempRuntime.getTime()){
				//현재 시간이 nextTempRuntime 보다 크면 실행, inTime에서 true로 변경하여 반환 한다.
				doc.conf.nextTempRuntime = next;
				log.trace('[checkTempTime] inTime= true, NextTempRuntime= ' + doc.conf.nextTempRuntime + ' now= ' + now);
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
		
		log.debug('[checkEnvironment] result : ' + doc.title +'(' + doc.id + ') isEnvironment= ' + doc.isEnvironment + ' (' + doc.envDesc + ')');
		
		callback(doc);
	});
}

var checkJobCompleted = function(doc, callback){
	if(jobCompletedList[doc.category] !== undefined){
		doc.isJobCompleted = jobCompletedList[doc.category][doc.id] === undefined ? false : true;
	}
	
	log.debug('[checkJobCompleted] result : ' + doc.title +'(' + doc.id + ') isJobCompleted= ' + doc.isJobCompleted);
	callback(doc);
}
		
var checkJobCompletedId = function(id){
	
}
var checkPriority = function(newDoc, callback){
	var unitKey = newDoc.side + '-' + newDoc.position;
	
	if(jobExecuteList[unitKey] == undefined){
		jobExecuteList[unitKey] = newDoc;
		log.trace('[checkPriority] JobExecuteList[' + unitKey + '] == undefined, added Lists: ' + JSON.stringify(newDoc, null, 4) );
	}else{
		var doc = jobExecuteList[unitKey];
		log.trace('[checkPriority] JobExecuteList[' + unitKey + '] == ' + JSON.stringify(doc, null, 4));
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
	
	log.debug('[checkPriority] result: ' + JSON.stringify(jobExecuteList, null, 4));
	
	callback();
}



var getStep = function(doc, callback){
	
	try{
		
		if(doc.step > doc.conf.stepNum){
			doc.step = doc.conf.stepNum;
		}
	
		var stepDesc = (doc.step == 0 ? '최대로 닫습니다.' : doc.step == doc.conf.stepNum ? '최대로 열겠습니다.' : doc.step + ' 단계로 이동합니다.');
		
		log.debug('[getStep] ' + doc.title +'(' + doc.id + ') step :' + stepDesc);
		callback(doc.step, stepDesc);
		
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

var addJobCompletedList = function(doc){
	if(jobCompletedList[doc.category] === undefined){
		jobCompletedList[doc.category] = [];										
	}
	
	jobCompletedList[doc.category].push(doc.id);
	
	log.debug('[addJobCompletedList] Completed List : ' + JSON.stringify(jobCompletedList, null, 4));
}

var clearJobCompletedList = function(docs){
	for(var key in docs){
		var doc = docs[key];
		
		if(!doc.inTime && jobCompletedList[doc.category] != undefined){			
			delete jobCompletedList[doc.category].remove(doc.id); 
		}
	}
	
	log.debug('[clearJobCompletedList] Job Completed List :' + JSON.stringify(jobCompletedList));
}