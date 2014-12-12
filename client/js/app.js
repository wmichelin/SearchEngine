$(function(){
  var rootURL = "http://localhost:3000";

  console.log('jquery live');
  
  function submit(){
    var query = $(".queryInput").val();
    
    $.ajax({
      type: "GET",
      url: rootURL + "/query",
      dataType: 'text',
      data: {query: query},
      success: function(res){
	processResponse(res);
      }
      
    }); 
  }
  
  
  function processResponse(res){
    $('.resultBody').html('');
    res = JSON.parse(res);
    if(res){
    res.sort(function(a, b){
      return b.score - a.score;
    });
    }
    else{
     $('.resultBody').append("<div>Sorry, no results! :(</div>") 
    }
    
    $.each(res, function(index, value){
      var elem = $("<div class='result'> " + (index + 1) + ": </div>");
      $(elem).append("<a href='" + value.name + "'>" + value.name + "</a>");
      $('.resultBody').append(elem);
    });
  }
  
  
  $(document).keypress(function(e) {
    if(e.which == 13) {
      submit();
    }
  });

  
  
  
  
  $(".submitButton").on("click", function(){
    submit();
  });
  
  
  
  
  
  
});

