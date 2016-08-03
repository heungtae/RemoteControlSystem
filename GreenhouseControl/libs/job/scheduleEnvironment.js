/**
 * http://usejsdoc.org/
 */

var CronJob = require('cron').CronJob,
	ghConfig = require('../../ghConfig'),
	store = require('../store/environment'),
	environment = require('../environment'),
	log = require('log4js').getLogger('libs.job.scheduleEnvironment');

ghConfig.getEnvironmentConfig(null, function(confs){
	confs.forEach(function(conf, index, array){
		log.debug(conf);
		
		environment.value(conf, function(err, result){

			store.read(conf, function(err, result){
				conf.docs = result;
				log.debug(conf);
			});
			
		});
	});
});


var job = new CronJob('*/10 * * * *', function() {
	try{	
		
		ghConfig.getEnvironmentConfig(null, function(confs){
			log.debug('get Environment config : ' + JSON.stringify(confs));
		
	
			confs.forEach(function(conf, index, array){
				log.debug(conf);
				
				environment.value(conf, function(err, result){
			
					log.debug(result);
					if(result.value != undefined){
						var remainDay = new Date();
						remainDay.setDate(remainDay.getDate() - config.app.environment.remainday);
						
						store.add(result, remainDay);
					}
				});
			});
			
		});
		
		
	}catch(e){
		log.error(e);
	}
  },null,true
);
