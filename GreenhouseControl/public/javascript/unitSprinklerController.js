
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

socket.on('sprinklerCallback', function(data){
	console.log(data.settime + ' ' + data.exectime);
	var val = (data.exectime / data.settime) * 100;
	val = Math.round(val);
	
	if(data.exectime == 0 && data.settime == 0) 
	{
		val = 100;

		setTimeout(function(){
			val = 0;
			$("#" + data.unit + "-state").css('width', val + '%').attr('aria-valuenow', val);
			$("#" + data.unit + "-state").text(val + '% 완료됨');		
		}, 3000);
	}
	
	$("#" + data.unit + "-state").css('width', val + '%').attr('aria-valuenow', val);
	$("#" + data.unit + "-state").text(val + '% 진행');
	
});
  
  
function unitAction(unit, command){
	var settimeid = "#" + unit + "-settime";
	
	var settime = $(settimeid).val();
	var data = {
		unit: unit,
		settime: settime,
		exectime: 0,
		pin: 0,
		command: command
	};
	
	
	console.log(data);
	
	socket.emit('sprinklerAction', data);

};

