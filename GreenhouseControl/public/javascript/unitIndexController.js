var socket = io.connect('http://localhost:8090');
var envConfigs;

socket.on('setEnvironment', function(configs){
	console.log(configs);

	envConfigs = configs;
	
	envConfigs.forEach(function(conf, index, array){
		socket.emit('getEnvironmentValue', conf);
	});
	
});

socket.on('setEnvironmentValue', function(result){
	console.log(result);
	try{
		$("#" + result.unit + "-" + result.zone).html(result.alias + ': ' + result.value);						
	}catch(e){
		
	}
});



