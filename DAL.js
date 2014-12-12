module.exports = function(mongoose, url){
	var module = {};

	mongoose.connect(url);

	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
		// test();
	});

	module.process = function(word, docName, text)
	{
		  try{
	  var query = {'word': word};
		//getting array of words, to count times of word occurence in document.
		var matches = text.match(new RegExp(word, "g"));
		var count;
		if(matches)
		    count = matches.length;
		else
		    count = 1;
		
		
		// debugger;
		Word.findOne(query, function(error, result){
			if(result)
			{
				console.log("RESULt");
				console.log(result);
			}

			if(error)
			{
				console.err('error finding word in DB');
				return 0;
			}
			if(!result)
			{
				if(word.length < 30)
					addWord(word, docName, count);
			}
			else{
				if(word.length < 30)
					editEntry(word, docName, count, result);
			}
		});
		  }
		  catch(err){
		  debugger;
		  
		  
		    
		  }
	}
	
	module.processDocument = function(url, length)
	{
	    var query = {name: url};
	    
	    Document.findOne(query, function(error, result){
	      if(!result && !error)
	      {
		addDocument(url, length);
	      }
	    });
	    //YOU WERE HERE... FUCKING STORE THE DOCUMENT AND ITS LENGTH!!!!!
	    //CHANGE THE SCHEMA
	}
	
	function addDocument(url, length){
	    var newDoc = new Document({
	      name: url,
	      length: length
	    })
	    
	    newDoc.save(function(err){
	      if(!err){
		console.log("-------saved " + url + " document to DB!!!!------");
	      }
	    });
	}

	function addWord(word, docName, count)
	{
		
		var newWord = new Word({
			word: word,
			containingDocuments: [{
			  docName: docName,
			  count: count
			}]
		})

		newWord.save(function(err)
		{
			if(err)
			{
				  //todo error handling?
			  // debugger;
			}
			else{
				console.log('added ' + word + "  to DB from " + docName);
				// debugger;
			}
		});
	}

	function editEntry(word, docName, count, result)
	{
		//grabbing the ID off the result from before
		var query = {_id: result._id};
		//creating object that will replace old object in the DB
		var newObj = result.toObject();
		//stripping the ID off the old one to avoid any collisions,
		//found this from http://stackoverflow.com/questions/25831859/cannot-read-property-id-of-undefined-while-using-mongoose-findoneandupdate
		delete newObj._id;
		var hasVisitedDoc = false;
		//can't think of better way to search right now... sadly
		for(var i = 0; i < result.containingDocuments.length; i++)
		{
		  if(result.containingDocuments[i].docName === docName){
		    hasVisitedDoc = true;
		    break;
		  }
		}
		
		if(!hasVisitedDoc)
		{
			//add current document to index object
			newObj.containingDocuments[newObj.containingDocuments.length] = {
			  docName: docName,
			  count: count
			  
			};
			//overwrite old one!
			Word.findOneAndUpdate(query, newObj, function(err, res){
				if(err)
				{
					// error handling?
				}
			});
		}
		else{
			//do nothing
			//here is where i'm going to 
			console.log('duplicate... do nothing');
		}
	}


 


	//we have to define the schema of the data to store it with mongoose
	var wordSchema = mongoose.Schema({
		word: {type: String, unique: true},
		containingDocuments: { type: Array, "default": [{}]}
	});
	
	var documentSchema = mongoose.Schema({
		name: {type: String, unique: true},
		length: Number
	});

	var Word = mongoose.model("Word", wordSchema);
	
	var Document = mongoose.model("Document", documentSchema);


	return module;

}