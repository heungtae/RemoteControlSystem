var CronJob = require('cron').CronJob,
	store = require('../db/notification'),
	env = require('../db/environment'),
	ghConfig = require('../../ghConfig'),
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
		var d = new Date();
		var m = d.getMinutes();
		//10분에 한번씩 환경데이터를 알림하기 위해서 jobCompletedList를 삭제 하도록 한다.
		if(m % 10 == 0 ){
			jobCompletedList = [];
		}
		
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
				var msg = doc.title + '의 환경데이터가 이탈했습니다. \n 환경데이터의 값은 ' + envDesc + ' 입니다.';
				send.message(msg);
			}
			
			clearJobCompletedList(docs);
			
		});
	}catch(e){
		log.error(e);
	}
  },null,true
);

var checkTime = function(doc, callback){
	if(doc.star != undefined){
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
	}else{
		doc.inTime = true;
	}
	callback(doc);
}

var checkEnvironment = function(doc, callback){
	
	var envCount = 0,
		check = 0,
		envDesc = '';
	
	ghConfig.getEnvironmentConfig(null, function(envResult){
		log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') Environment configuration length : ' + envResult.length);
		
		envResult.forEach(function(envConf){
			var unitKey = envConf.unit + '-' + envConf.zone;
			var operKey = envConf.unit + '-' + envConf.zone + 'Oper';
			
			log.trace('[checkEnvironment] ' + doc.title +'(' + doc.id + ') ' + JSON.stringify(envConf));
			
			if(doc[operKey] != undefined){
				envCount++;
				envDesc = envDesc + (envDesc == '' ? '': ' 그리고 ') + envConf.alias + '가 ' + envConf.value;	
				
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
		doc.envDesc = envDesc;
		
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
	
	callback();
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
