var CronJob = require('cron').CronJob,
	ghConfig = require('../../ghConfig'),
	store = require('../db/scheduleSprinkler'),
	sprinkler = require('../../routes/sprinkler')
	log4js = require('log4js'),
	send = require('../telegram/send');

var	log = log4js.getLogger('libs.job.scheduleSprinkler');
log.setLevel(config.loglevel);

var jobCompletedList = [];
var jobExecuteList = [];


var job = new CronJob('*/10 * * * *', function() {
	try{	
				
		store.get(function(err, docs, confs){
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
							
				getConf(doc, confs, function(doc){
					if(result){
						var data = {
								unit: doc.baseconf.unit,
								settime: doc.period.trim(),
								exectime: 0,
								pin: 0,
								command: 'on'
						};
						
						sprinkler.updateJob(data, function(){
							log.debug('[CronJob] ' + doc.title +'(' + doc.id + ') starting sprinkler base unit: ' + JSON.stringify(data));	
							
						});
						
						data = {
								unit: doc.unit.trim(),
								settime: doc.period.trim(),
								exectime: 0,
								pin: 0,
								command: 'on'
						};
						
						sprinkler.updateJob(data, function(){
							log.debug('[CronJob] ' + doc.title +'(' + doc.id + ') starting sprinkler: ' + JSON.stringify(data));	
							send.message(doc.title + '으로 예약된 자동관수를 시작했습니다. \n ' + doc.alias + '를 ' + doc.period.trim() + '동안 실행합니다.'); 
							jobCompletedList.push(doc.id);
						});
					}
					
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
	var now = new Date();
	var start = new Date();
	//var end = new Date();
	
	start.setHours(doc.start.substring(0, 2), doc.start.substring(3, 5), 00, 00)
	var end = new Date(start.getTime() + doc.period * 60 * 1000);
	
	var yearStart = new Date(now.getFullYear(), 0, 0);
	var diff = now - yearStart;
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / oneDay);
	
	log.trace('[CronJob] ' + doc.title +'(' + doc.id + ') ' + start + ' ~ ' + end + ' & ' + now);
	log.trace('[CronJob] ' + doc.title +'(' + doc.id + ') ' + day + ' ' + doc.cycle);
	
	if((now.getTime() > start.getTime() && now.getTime() < end.getTime()) && (day % doc.cycle == 0)){
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
			var operKey = envConf.unit + '-' + envConf.zone + '-Oper';
			
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
};

var checkJobCompleted = function(doc, callback){
	doc.isJobCompleted = jobCompletedList[doc.id] == undefined ? false : true;
	callback(doc);
}

var checkPriority = function(newDoc, callback){
	var unitKey = newDoc.unit;
	
	jobExecuteList[unitKey] = newDoc;
	
	callback();
}

var getConf = function(doc, confs, callback){
	
	try{
		log.trace('[getConf] ' + doc.title +'(' + doc.id + ') found shutter documents: count= ' + confs.length);
		
		var conf;
		for(var i =0; i < confs.length; i ++){
			val = confs[i];
			if(val.unit == doc.unit.trim()){
				doc.conf = val;
				break;
			} 
		}
		
		
		for(var i =0; i < confs.length; i ++){
			val = confs[i];
			if(val.baseunit){
				doc.baseconf = val;
				break;
			} 
		}
		
		callback(doc);
	}catch(e){
		log.error(e);
		callback(doc);
	}
	
};

var clearJobCompletedList = function(docs){
	for(var key in docs){
		var doc = docs[key];
		
		if(!doc.inTime && jobCompletedList[doc.id] != undefined){			
			delete jobCompletedList[doc.id]; 
		}
	}
	
	log.trace('[clearJobCompletedList] Job Completed List :' + JSON.stringify(jobCompletedList));
}

