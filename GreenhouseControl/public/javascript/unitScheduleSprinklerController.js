var socket = io.connect('http://localhost:8090');
$('.alert').hide();

var sprinklerConfs, envConfs, sprinklerDocs;
var docId;

socket.on('scheduleSprinklerConfigCallback', function(docs, conf, envConf){
	sprinklerConfs = conf;
	envConfs = envConf;
	sprinklerDocs = docs;
});


$('#myTable').on('click', '.clickable-row', function(event) {
	  $(this).addClass('active').siblings().removeClass('active');
	  docId = $(this).data("id");
	  console.log(docId);
	  
	  var doc;
	  for(index = 0; index<sprinklerDocs.length; index++){
		  doc = sprinklerDocs[index];
		  if(doc.id == docId)
			break;
	  }
	  
	  $('#title').val(doc.title);
	  $('#unit').attr('value', conf.unit);
	  $('#unit').html(conf.alias+' <span class="caret"></span>');
	  $('#start').val(doc.start);
	  $('#period').val(doc.period);
	  $('#cycle').val(doc.cycle);
	  
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
	  for(sc = 0; sc < sprinklerConfs.length; sc++){
	    	conf = sprinklerConfs[sc];
	    	
	    	if(doc.unit == conf.unit){
	    		break;
	    	}
	  }	 
	  
	  $('#btnUpdate').removeAttr('disabled');
	  $('#btnCencel').removeAttr('disabled');
	});

function add(index){
	if(index == -1){	
		if(sprinklerDocs.length >= 1){
			docId = sprinklerDocs[sprinklerDocs.length -1].id + 1;
			index = sprinklerDocs.length;			
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
	data.unit = $('#unit').attr('value');
	data.alias = $('#unit').text(); 
	
	//shutter step
	data.start = $('#start').val();
	data.period = $('#period').val();
	data.cycle = $('#cycle').val();
	
	
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
		sprinklerDocs[index] = data;
		socket.emit('scheduleSprinkler', sprinklerDocs);
		console.log(sprinklerDocs);
	}
};
	     
function update(){
	var index;
	
	if(docId == undefined)
		return;
	
	for(index = 0; index<sprinklerDocs.length; index++){
		var doc = sprinklerDocs[index];
		if(doc.id == docId)
			break;
	}
	
	add(index);
};

function del(id){
	var index;
	var newSprinklerDocs = [];
	for(index = 0; index<sprinklerDocs.length; index++){
		var doc = sprinklerDocs[index];
		if(doc.id != id){
			newSprinklerDocs.push(doc);
		}
	}
	
	socket.emit('scheduleSprinkler', newSprinklerDocs);
};

function cancel(){
	location.reload();
}

socket.on('scheduleSprinklerCallback', function(){
	location.reload();
});

$('.dropdown-menu li a').click(function(){
  var selText = $(this).text();
  var selVal = $(this).attr('value');
  
  $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
  $(this).parents('.btn-group').find('.dropdown-toggle').attr('value', selVal);
});