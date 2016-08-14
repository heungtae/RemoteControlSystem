/**
 * http://usejsdoc.org/
 */

var CronJob = require('cron').CronJob,
	ghConfig = require('../../ghConfig'),
	db = require('../db/environment'),
	environment = require('../environment'),
	log = require('log4js').getLogger('libs.job.scheduleEnvironment');

ghConfig.getEnvironmentConfig(null, function(confs){
	confs.forEach(function(conf, index, array){
		log.debug('[initialize] start : ' + JSON.stringify(conf));
		db.get(conf, function(err, result){
			conf.docs = result;
			conf.value = result[result.length - 1].value;
			log.debug('[initialize] get lastest value : ' + JSON.stringify(result[result.length - 1]));
			log.debug('[initialize] completed : ' + JSON.stringify(conf));
		});
	});
});


var job = new CronJob('*/10 * * * *', function() {
	try{	
		
		ghConfig.getEnvironmentConfig(null, function(confs){
			log.trace('[Job] get environment configs : ' + JSON.stringify(confs));
		
	
			confs.forEach(function(conf, index, array){
				log.trace('[Job] get environment value : ' + JSON.stringify(conf));
				
				environment.value(conf, function(err, result){
					log.debug('[Job] get environment value result=' + JSON.stringify(result));
					if(result.value != undefined){
						var remainDay = new Date();
						remainDay.setDate(remainDay.getDate() - config.app.environment.remainday);
						db.update(result, remainDay);
						log.debug('[Job] store added conf=' + JSON.stringify(conf));
					}
				});
			});
			
		});
		
		
	}catch(e){
		log.error(e);
	}
  },null,true
);
