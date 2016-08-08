var socket = io.connect('http://localhost:8090');
$('.alert').hide();
var notificationConfs, envConfs, notificationDocs;
var docId;
var maxStepNum = 0;

socket.on('notificationConfigCallback', function(docs, envConf){
	envConfs = envConf;
	notificationDocs = docs;
});

$('#myTable').on('click', '.clickable-row', function(event) {
	  $(this).addClass('active').siblings().removeClass('active');
	  docId = $(this).data("id");
	  console.log(docId);
	  
	  var doc;
	  for(index = 0; index<notificationDocs.length; index++){
		  doc = notificationDocs[index];
		  if(doc.id == docId)
			break;
	  }
	  
	  $('#title').val(doc.title);
	  
	  if(doc['start'] != null){ 
		  $('#time-Apply').prop("checked", true);
		  $('#start').val(doc.start);
		  $('#end').val(doc.end);
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
		if(notificationDocs.length >= 1){
			docId = notificationDocs[notificationDocs.length -1].id + 1;
			index = notificationDocs.length;			
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
	
	if($('#time-Apply').is(':checked') && (data.start == '' || data.end == '') ){
		 $('.alert').show();
	}
	else{
		notificationDocs[index] = data;
		socket.emit('notification', notificationDocs);
		console.log(notificationDocs);
	}
};
	     
function update(){
	var index;
	for(index = 0; index < notificationDocs.length; index++){
		var doc = notificationDocs[index];
		if(doc.id == docId)
			break;
	}
	
	add(index);
};

function del(id){
	var index;
	var newNotificationDocs = [];
	for(index = 0; index < notificationDocs.length; index++){
		var doc = notificationDocs[index];
		if(doc.id != id){
			newNotificationDocs.push(doc);
		}
	}
	
	socket.emit('notification', newNotificationDocs);
};

function cancel(){
	location.reload();
}

socket.on('notificationCallback', function(){
	location.reload();
});

$('.dropdown-menu li a').click(function(){
  var selText = $(this).text();
  var selVal = $(this).attr('value');
  
  $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
  $(this).parents('.btn-group').find('.dropdown-toggle').attr('value', selVal);
});