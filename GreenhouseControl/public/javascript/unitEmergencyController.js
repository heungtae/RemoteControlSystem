var socket = io.connect('http://localhost:8090');
$('.alert').hide();
var shutterConfs, envConfs, emergencyControlDocs;
var docId;
var maxStepNum = 0;

socket.on('emergencyControlConfigCallback', function(docs, conf, envConf){
	shutterConfs = conf;
	envConfs = envConf;
	emergencyControlDocs = docs;
	
	for(i = 0; i < shutterConfs.length; i++){
		var stepNum = shutterConfs[i].stepNum;
		if(maxStepNum < stepNum){
	  		maxStepNum = stepNum;
		}
	}
});

$('#myTable').on('click', '.clickable-row', function(event) {
	  $(this).addClass('active').siblings().removeClass('active');
	  docId = $(this).data("id");
	  console.log(docId);
	  
	  var doc;
	  for(index = 0; index<emergencyControlDocs.length; index++){
		  doc = emergencyControlDocs[index];
		  if(doc.id == docId)
			break;
	  }
	  
	  $('#title').val(doc.title);
	  $('#priority').val(doc.priority)
	  $('#side-position').attr('value', doc.side + '-' + doc.position);
	  $('#side-position').html(doc.alias+' <span class="caret"></span>');
	  $('#step').attr('value', doc.step );
	  $('#step').html(( doc.step == 0 ? '닫힘': doc.step > maxStepNum ? '열림' : doc.step + ' 단계')+' <span class="caret"></span>');
	  
	  if(doc['start'] != null){
		  $('#time-Apply').prop("checked", true);
		  $('#start').val(doc.start);
		  $('#end').val(doc.end);
	  }else{
		  $('#time-Apply').prop("checked", false);
	  }
	  
	  for(ev = 0; ev < envConfs.length; ev++){
	    	var conf = envConfs[ev];
	    	
	    	if(doc[conf.unit + '-' + conf.zone + '-Oper'] != null){
	    		$('#' + conf.unit + '-' + conf.zone + '-Apply').prop("checked", true);
	    		$('#' + conf.unit + '-' + conf.zone + '-Oper').attr('value', doc[conf.unit + '-' + conf.zone + '-Oper']);
	    		
	    		if(doc[conf.unit + '-' + conf.zone + '-Oper'] == '>')
	    			$('#' + conf.unit + '-' + conf.zone + '-Oper').html('클 경우 <span class="caret"></span>');
	    		else if(doc[conf.unit + '-' + conf.zone + '-Oper'] == '<')
	    			$('#' + conf.unit + '-' + conf.zone + '-Oper').html('작을 경우 <span class="caret"></span>');
	    		else 
	    			$('#' + conf.unit + '-' + conf.zone + '-Oper').html( doc[conf.unit + '-' + conf.zone + '-Oper'] + ' <span class="caret"></span>');
	    		
		    	if(conf.type == 'number'){
		    		$('#' + conf.unit + '-' + conf.zone + '-Value').val(doc[conf.unit + '-' + conf.zone + '-Value']);
		    	}
	    	}else{
	    		$('#' + conf.unit + '-' + conf.zone + '-Apply').prop("checked", false);
	    		$('#' + conf.unit + '-' + conf.zone + '-Oper').attr('value', $('#' + conf.unit + '-' + conf.zone + '-Oper').attr('defaultvalue'));
	    		$('#' + conf.unit + '-' + conf.zone + '-Oper').html($(conf.unit + '-' + conf.zone + '-Oper').attr('defaultvalue') + ' <span class="caret"></span>');
	    		
		    	if(conf.type == 'number'){
		    		$('#' + conf.unit + '-' + conf.zone + '-Oper').html('클 경우 <span class="caret"></span>');
		    		$('#' + conf.unit + '-' + conf.zone + '-Value').val(0);
		    	}
	    	}
	    }
	  
	  $('#btnUpdate').removeAttr('disabled');
	  $('#btnCencel').removeAttr('disabled');
	});

function add(index){
	if(index == -1){	
		if(emergencyControlDocs.length >= 1){
			docId = emergencyControlDocs[emergencyControlDocs.length -1].id + 1;
			index = emergencyControlDocs.length;			
		}else{
			docId = 1;
			index = 0;
		}
		
	}
	var data = {};
	//id
	data['id'] = docId;
	
	//title
	data['title'] = $('#title').val();
	
	//shutter unit config
	var unitArray = $('#side-position').attr('value').split('-');
	
	data.side = unitArray[0];
	data.position = unitArray[1];
	data.alias = $('#side-position').text(); 
	
	//shutter step
	data.step = parseInt($('#step').attr('value'));
	
	if($('#time-Apply').is(':checked')){	
		data.start = $('#start').val();
		data.end = $('#end').val();
	}
	
	
	//환경값 설정 결과 수집
	for(ev = 0; ev < envConfs.length; ev++){
    	var conf = envConfs[ev];
    	
    	if($('#' + conf.unit + '-' + conf.zone + '-Apply').is(':checked')){	
	    	if(conf.type == 'number'){
	    		data[conf.unit + '-' + conf.zone + '-Value'] = parseInt($('#' + conf.unit + '-' + conf.zone + '-Value').val());
	    		data[conf.unit + '-' + conf.zone + '-Oper'] = $('#' + conf.unit + '-' + conf.zone + '-Oper').attr('value');
	    	}else if(conf.type == 'boolean'){
	    		data[conf.unit + '-' + conf.zone + '-Oper'] = $('#' + conf.unit + '-' + conf.zone + '-Oper').attr('value');
	    	}
    	}
    }
	
	if(data.start == '' || data.end == '' ){
		 $('.alert').show();
	}
	else{
		emergencyControlDocs[index] = data;
		socket.emit('emergencyControl', emergencyControlDocs);
		console.log(emergencyControlDocs);
	}
};
	     
function update(){
	var index;
	for(index = 0; index<emergencyControlDocs.length; index++){
		var doc = emergencyControlDocs[index];
		if(doc.id == docId)
			break;
	}
	
	add(index);
};

function del(id){
	var index;
	var newEmergencyControlDocs = [];
	for(index = 0; index<emergencyControlDocs.length; index++){
		var doc = emergencyControlDocs[index];
		if(doc.id != id){
			newEmergencyControlDocs.push(doc);
		}
	}
	
	socket.emit('emergencyControl', newEmergencyControlDocs);
};

function cancel(){
	location.reload();
}

socket.on('emergencyControlCallback', function(){
	location.reload();
});

$('.dropdown-menu li a').click(function(){
  var selText = $(this).text();
  var selVal = $(this).attr('value');
  
  $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
  $(this).parents('.btn-group').find('.dropdown-toggle').attr('value', selVal);
});