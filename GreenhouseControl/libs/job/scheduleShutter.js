var CronJob = require('cron').CronJob,
	store = require('../db/scheduleShutter'),
	env = require('../db/environment'),
	ghConfig = require('../../ghConfig'),
	shutter = require('../../routes/shutter'),
	sleep = require('../sleep'),
	log4js = require('log4js'),
	send = require('../telegram/send');

var	log = log4js.getLogger('libs.job.scheduleShutter');
log.setLevel(config.loglevel);

var jobCompletedList = [];
var jobExecuteList = [];

// 1. 실행 시간의 구간안에 포함되는지 확인 한다.
// 1.1. 실행 시간이 아니라면 실행 중인 항목에 대해서 삭제 한다.
// 2. 실행 시간의 구간안에 실행 중인지를 확인 한다.
// 3. 환경값을 읽어와서 필요한 환경 값을 Setting 한다.
// 4. 실행 가능한지를 확인 한다.
// 5. 실행한다.

var job = new CronJob('*/10 * * * *', function() {
	try{	
		store.get(function(err, docs, conf){
			//시간, 환경값, 실행 여부를 확인한다. 
			jobExecuteList = [];
			
			for(var key in docs){
				var doc = docs[key];
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
			}
			
			for(i = 0; i < jobExecuteList.length; i++){
				var doc = jobExecuteList[i];
				getStep(doc, conf, function(step, stepDesc){
					var data = {
							side: doc.side.trim(),
							position: doc.position.trim(),
							step: step,
							settime: 0,
							exectime: 0,
							playpin: 0,
							stoppin: 0,
							command: 'execute'
					};
					
					shutter.updateJob(data, function(){
						log.debug('[CronJob] ' + doc.title +'(' + doc.id + ') starting shutter: ' + JSON.stringify(data));	
						send.message(doc.title + '으로 예약된 창 제어를 시작했습니다. \n ' + doc.alias + '를 ' + stepDesc);
						jobCompletedList.push(doc.id);
					});
				});
			}
			
			clearJobCompletedList(docs);
		});
	}catch(e){
		log.error(e);
	}
  },null,true
);

var checkTime = function(doc, callback){
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

var checkEnvironment = function(doc, callback){
	
	var envCount = 0,
		check = 0;
	
	ghConfig.getEnvironmentConfig(null, function(envResult){
		log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') Environment configuration length : ' + envResult.length);
		envResult.forEach(function(envConf){
			var unitKey = envConf.unit + '-' + envConf.zone;
			var operKey = envConf.unit + '-' + envConf.zone + 'Oper';
			
			log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') ' + JSON.stringify(envConf));
			
			if(doc[operKey] != undefined){
				envCount++;
					
				if(envConf.value != undefined){
					
					if(envConf.type == 'number'){
						if(doc[operKey] == '>'){
							check += envConf.value > parseInt(doc[unitKey]) ? 1: 0;
						} else {
							check += envConf.value < parseInt(doc[unitKey]) ? 1: 0;
						}							

						log.trace('[checkEnvironment] number type environment' + doc.title +'(' + doc.id + ') Result envCount(' + envCount + ') = check(' + check + ') UnitKey: ' + unitKey + ' ' + doc[unitKey] + ' ' +  envConf.value + ' ' + doc[operKey] );
					}else if(envConf.type == 'boolean'){
						if(doc[operKey].trim() == 'true'){
							check += envConf.value ? 1: 0;
						} else {
							check += !envConf.value ? 1: 0;
						}	
					
						log.trace('[checkEnvironment] boolean type environment' + doc.title +'(' + doc.id + ') Result envCount(' + envCount + ') = check(' + check + ') UnitKey: ' + unitKey + ' ' +  envConf.value + ' = ' + doc[operKey]);
					}
					
				}
						
			}
		});
		
		if(envCount == check){
			doc.isEnvironment = true;
		}else{
			doc.isEnvironment = false;
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
		if(doc.priority > newDoc.priority){
			jobExecuteList[unitKey] = newDoc				
		}else{
			
			//compare environment value 
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



var getStep = function(doc, confs, callback){
	
	try{
		log.trace('[getStep] ' + doc.title +'(' + doc.id + ') found shutter documents: count= ' + confs.length);
		
		var conf;
		for(var i =0; i < confs.length; i ++){
			val = confs[i];
			if(val.side == doc.side.trim() && val.position == doc.position.trim()){
				conf = val;
				break;
			} 
		}
		
		doc.conf = conf;
		
		var step = parseInt(doc.step.trim());
		
		if(step > conf.stepNum){
			step = conf.stepNum;
		}
	
		var stepDesc = (step == 0 ? '최대로 닫습니다.' : step == conf.stepNum ? '최대로 열겠습니다.' : step + ' 단계로 이동합니다.');
		
		log.debug('[getStep] ' + doc.title +'(' + doc.id + ') step :' + stepDesc);
		callback(step, stepDesc);
		
	}catch(e){
		log.error(e);
		callback(-1);
	}
	
};


var clearJobCompletedList = function(docs){
	for(var id in docs){
		if(jobCompletedList[docs[id].id] != undefined)
			delete jobCompletedList[key]; 
	}
	
	log.trace('[clearJobCompletedList] Job Completed List :' + JSON.stringify(jobCompletedList));
}
