var socket = io.connect('http://localhost:8090');
$('.alert').hide();
var shutterConfs, envConfs, temperatureControlDocs;
var docId;
var maxStepNum = 0;

socket.on('temperatureControlConfigCallback', function(docs, conf, envConf){
	shutterConfs = conf;
	envConfs = envConf;
	temperatureControlDocs = docs;
	
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
	  for(index = 0; index<temperatureControlDocs.length; index++){
		  doc = temperatureControlDocs[index];
		  if(doc.id == docId)
			break;
	  }
	  
	  $('#title').val(doc.title);
	  $('#priority').val(doc.priority)
	  $('#side-position').attr('value', doc.side + '-' + doc.position);
	  $('#side-position').html(doc.alias+' <span class="caret"></span>');
	  
	  $('#step').attr('value', doc.step );
	  $('#step').html(( doc.step == 0 ? '닫힘': doc.step == maxStepNum ? '열림' : doc.step + ' 단계')+' <span class="caret"></span>');
	  $('#start').val(doc.start);
	  $('#end').val(doc.end);
	  
	  for(ev = 0; ev < envConfs.length; ev++){
	    	var conf = envConfs[ev];
	    	
	    	if(doc[conf.unit + '-' + conf.zone + '-Oper'] != null){
	    		$('#' + conf.unit + '-' + conf.zone + '-Apply').prop("checked", true);
	    		
	    		$('#' + conf.unit + '-' + conf.zone + '-Oper').attr('value', doc[conf.unit + '-' + conf.zone + '-Oper']);
	    		
		    	if(conf.type == 'number'){
		    		$('#' + conf.unit + '-' + conf.zone + '-value').val(doc[conf.unit + '-' + conf.zone + '-Value']);
		    	}
	    	}else{
	    		$('#' + conf.unit + '-' + conf.zone + '-Apply').prop("checked", false);
	    		
	    		$('#' + conf.unit + '-' + conf.zone + '-Oper').attr('value', $('#' + conf.unit + '-' + conf.zone + '-Oper').attr('defaultvalue'));
	    		
		    	if(conf.type == 'number'){
		    		$('#' + conf.unit + '-' + conf.zone + '-value').val(0);
		    	}
	    	}
	    }
	  
	  
	  var conf;
	  for(sc = 0; sc < shutterConfs.length; sc++){
	    	conf = shutterConfs[sc];
	    	
	    	if(doc.side == conf.side && doc.position == conf.position){
	    		break;
	    	}
	    }
	  
	  
	  
	  $('#btnUpdate').removeAttr('disabled');
	  $('#btnCencel').removeAttr('disabled');
	});

function add(index){
	if(index == -1){	
		if(temperatureControlDocs.length >= 1){
			docId = temperatureControlDocs[temperatureControlDocs.length -1].id + 1;
			index = temperatureControlDocs.length;			
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
	data.step = $('#step').attr('value');
	data.start = $('#start').val();
	data.end = $('#end').val();
	
	
	//환경값 설정 결과 수집
	for(ev = 0; ev < envConfs.length; ev++){
    	var conf = envConfs[ev];
    	
    	if($('#' + conf.unit + '-' + conf.zone + '-Apply').is(':checked')){	
	    	if(conf.type == 'number'){
	    		data[conf.unit + '-' + conf.zone + '-Value'] = $('#' + conf.unit + '-' + conf.zone + '-value').val();
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
		temperatureControlDocs[index] = data;
		socket.emit('temperatureControl', temperatureControlDocs);
		console.log(temperatureControlDocs);
	}
};
	     
function update(){
	var index;
	for(index = 0; index<temperatureControlDocs.length; index++){
		var doc = temperatureControlDocs[index];
		if(doc.id == docId)
			break;
	}
	
	add(index);
};

function del(id){
	var index;
	var newTemperatureControlDocs = [];
	for(index = 0; index<temperatureControlDocs.length; index++){
		var doc = temperatureControlDocs[index];
		if(doc.id != id){
			newTemperatureControlDocs.push(doc);
		}
	}
	
	socket.emit('temperatureControl', newTemperatureControlDocs);
};

function cancel(){
	location.reload();
}

socket.on('temperatureControlCallback', function(){
	location.reload();
});

$('.dropdown-menu li a').click(function(){
  var selText = $(this).text();
  var selVal = $(this).attr('value');
  
  $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
  $(this).parents('.btn-group').find('.dropdown-toggle').attr('value', selVal);
});