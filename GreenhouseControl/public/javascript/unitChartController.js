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
	//console.log(result);
	try{
		$("#" + result.unit + "-" + result.zone).html(result.alias + ': ' + result.value);						
	}catch(e){
		
	}
});


google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);
	
function drawChart(){
	try{
		
		var unit, zone, alias;
		var data, conf;
		var cnt = 0;
		for(var idx in envConfigs){
			conf = envConfigs[idx];
			
			if(unit == undefined || conf.unit != unit){
				console.log('Create Chart : ' + unit);
				//Create Chart
				if(unit != undefined){
					var options = {
							hAxis: {
								title: '시간',
								format: "HH:mm"
							}
					};
					console.log('Create chart-' + unit);
					var chart = new google.visualization.LineChart(document.getElementById('chart-' + unit));
					
					chart.draw(data, options);
				}
				unit = conf.unit;
				data = new google.visualization.DataTable();
				cnt = 0;
				data.addColumn('string', 'Date');
				data.addRows(conf.docs.length - 1);
				
			}
			
			data.addColumn('number', conf.alias);
			cnt++;
			for(i =1; i <= data.getNumberOfRows(); i++){
				if(i > conf.docs.length)
					break;
				
				var date = new Date(conf.docs[i].date);
				
				data.setCell(i - 1, 0, date.getDate() + '일 ' + date.getHours() + ':' + date.getMinutes());
				data.setCell(i - 1, cnt, conf.docs[i].value);
			}
		
		}
		
		if(unit != undefined){
			var options = {
					hAxis: {
						title: '시간',
						format: "HH:mm"
					}
			};
			var chart = new google.visualization.LineChart(document.getElementById('chart-' + unit));
			
			chart.draw(data, options);
		}
		
	}catch(e){
		console.error(e);
	} 
};

