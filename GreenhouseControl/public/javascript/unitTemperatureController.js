var socket = io.connect('http://localhost:8090');
$('.alert').hide();
var shutterConfs, envConfs, shutterDocs;

socket.on('scheduleShutterConfigCallback', function(docs, conf, envConf){
	console.log(conf);
	shutterConfs = conf;
	envConfs = envConf;
	shutterDocs = docs;
});

function scheduleAction(id, command){
	var data = {
			id: id,
			title: null,
			side: null,
			position: null,
			step: null,
			start: null,
			end: null,
			apply: 'false'
	};
	
	for(ev = 0; ev < envConfs.length; ev++){
    	var conf = envConfs[ev];
    	
    	if(envConfs.length > (ev+1) && conf.unit == envConfs[ev+1].unit){
    		continue;
    	}
    	
    	data[conf.unit] = null;
    	data[conf.unit + 'Apply'] = null;
    	data[conf.unit + 'Zone'] = null;
    	
    	if(conf.type == 'number'){
    		data[conf.unit + 'Oper'] = null;
    	}
    }
	
	if(command == 'add'){
		data.title = $("#title-" + id).val();
		data.side = $("#side-" + id).text();
		data.position = $("#position-" + id).text();
		data.step = $("#step-" + id).text();
		data.start = $("#start-" + id).val();
		data.end = $("#end-" + id).val();
		data.apply = $("#apply-" + id).is(":checked");
		
		for(ev = 0; ev < envConfs.length; ev++){
	    	var conf = envConfs[ev];
	    	
	    	if(envConfs.length > (ev+1) && conf.unit == envConfs[ev+1].unit){
	    		continue;
	    	}
	    	
	    	
	    	data[conf.unit + 'Apply'] = $("#" + conf.unit + "Apply-" + id).is(":checked");
	    	data[conf.unit + 'Zone'] = $("#" + conf.unit + "Zone-" + id).text();
	    	
	    	if(conf.type == 'number'){
	    		data[conf.unit] = $("#" + conf.unit + "-" + id).val();
	    		data[conf.unit + 'Oper'] = $("#" + conf.unit + "Oper-" + id).text();;
	    	}else if(conf.type == 'boolean'){
	    		data[conf.unit] = $("#" + conf.unit + "-" + id).text();
	    	}
	    }
	}

	if(data.start == "" || data.end == "" ){
		 $('.alert').show();
	}
	else{
		socket.emit('scheduleShutter', data);
		console.log(data);
	}
};
	     

socket.on('scheduleShutterCallback', function(data){
	console.log(data);
	
	var id = data.id;
	
	$("#title-" + id).val(data.title);
	
	if(data.side != null)
		$("#side-" + id).text(data.side);
	else{
		$("#side-" + id).text($("#side-" + id).attr("defaultValue"));
	}
	
	if(data.position != null)
		$("#position-" + id).text(data.position);
	else
		$("#position-" + id).text($("#position-" + id).attr("defaultValue"));
	
	if(data.step != null)
		$("#step-" + id).text(data.step);
	else
		$("#step-" + id).text($("#step-" + id).attr("defaultValue"));
	
	
	$("#start-" + id).val(data.start);
	$("#end-" + id).val(data.end);
	$("#temp-" + id).val(data.temp);
	
	if(data.tempApply == 'true' )
		$("#tempApply-" + id).checked = true;
	else
		$("#tempApply-" + id).checked = false;
	
	if(data.apply == 'true' )
		$("#apply-" + id).checked = true;
	else
		$("#apply-" + id).checked = false;
});

$(".dropdown-menu li a").click(function(){
  var selText = $(this).text();
  $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
});