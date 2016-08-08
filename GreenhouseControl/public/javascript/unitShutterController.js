var socket = io.connect('http://localhost:8090');
var step;
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

socket.on('shutterCallback', function(data){
	console.log(data);
	var val = (data.exectime / data.settime) * 100;
	val = Math.round(val);
	
	if(data.exectime == 0 && data.settime == 0) 
	{
		val = 100;

		setTimeout(function(){
			val = 0;
			$("#" + data.location + "-state").css('width', val + '%').attr('aria-valuenow', val);
			$("#" + data.location + "-state").text(val + '% 완료됨');		
		}, 3000);
	}
	
	$("#" + data.location + "-state").css('width', val + '%').attr('aria-valuenow', val);
	$("#" + data.location + "-state").text(val + '% 진행');
	
});
  
  
function unitAction(side, position, command){
	var data = {
		category : 'manual',
		side: side,
		position: position,
		step: step,
		settime: 0,
		exectime: 0,
		playpin: 0,
		stoppin: 0,
		command: command
	};
	
	
	console.log(data);
	
	socket.emit('shutterAction', data);

};
	        
$(".dropdown-menu li a").click(function(){
  var selText = $(this).text();
  step = parseInt($(this).attr("value"));
  
  console.log(step);
  
  $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
});