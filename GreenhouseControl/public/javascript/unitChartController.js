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
	console.log('draw chart');
	try{
		
		var unit, zone, alias;
		var data, conf;
		var cnt = 0;
		for(idx in envConfigs){
			conf = envConfigs[idx];
			
			if(unit == undefined || conf.unit != unit){
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
				data.addRows(conf.datas.length - 1);
			}
			
			data.addColumn('number', conf.alias);
			cnt++;
			for(i =1; i < conf.datas.length; i++){
				var date = new Date(conf.datas[i].date);
				
				data.setCell(i - 1, 0, date.getDate() + '일 ' + date.getHours() + ':' + date.getMinutes());
				data.setCell(i - 1, cnt, conf.datas[i].value);
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


/*
google.charts.setOnLoadCallback(function () {
	envConfigs.forEach(function(conf, index, array){
		socket.emit('getEnvironmentRecords', conf);
	});
});

	
socket.on('setEnvironmentRecords', function(result){
	
	
	try{
		
		var unit, zone, alias;
		
		if(result.length > 2 ){
			unit = result[1].unit;
			zone = result[1].zone;
		}
		
		for(var index in envConfigs){
			if(unit == envConfigs[index].unit && zone == envConfigs[index].zone)
				alias = envConfigs[index].alias;
		}
		
		console.log(unit + '-' + zone + '-' + alias);
		var data = new google.visualization.DataTable();
		data.addColumn('string', 'Date');
		data.addColumn('number', alias);
		data.addRows(result.length - 1);
		
		for(i =1; i < result.length; i++){
			var date = new Date(result[i].date);
			
			data.setCell(i - 1, 0, date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes());
			data.setCell(i - 1, 1, result[i].value);
		}

		var options = {
		      hAxis: {
		        title: 'Time',
		        format: "HH:mm"
		      }
		    };
		console.log(document.getElementById('chart-' + unit));
		var chart = new google.visualization.LineChart(document.getElementById('chart-' + unit));

        chart.draw(data, options);
	}catch(e){
		console.error(e);
	} 
});

*/
