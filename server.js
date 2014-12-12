var express = require('express');
var app = express();
var mongoose = require('mongoose');
var path = require('path');

//stemmer module from npm
// https://www.npmjs.org/package/porter-stemmer
var stemmer = require('porter-stemmer').stemmer;

var url = "mongodb://localhost/test";

mongoose.connect(url);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	// test();
});

//filepaths for html
app.use('/js', express.static(path.join(__dirname, '/client/js')));
app.use('/css', express.static(path.join(__dirname, '/client/css')));

//serving up the main page
app.get("/", function(req, res)
{
    res.sendFile("client/index.html", {"root": __dirname});
});

//this application turned into callback hell

app.get('/query', function(req, res){
   var word = req.query['query'];
    
   word = word.toLowerCase();
   word = word.removeStopWords();
   word = word.replace(/[^\w\s]/g,'');

   wordArray = word.split(" ");
   
   var resultArray = [];
   for(var i = 0; i < wordArray.length; i++)
   {
     wordArray[i] = stemmer(wordArray[i]);
     
     //initializing for later
     resultArray[i] = {};
     
  }
   
   var i = 0;
   loop();
   function loop()
   {
      var query = {'word': wordArray[i]};
      Word.findOne(query, function(err, response){
	if(response)
	{
	  resultArray[i] = response.toObject();
	}
	else{
	  resultArray[i] = null;
	}
	
	if(i < wordArray.length)
	{
	  i++;
	  loop();
	}
	else{
	  evaluateResults(resultArray);
	}
	
      });
   
      
   }
   
   
     
   
   function evaluateResults(results)
   {
     //BM25 LETS DO IT	
      Document.aggregate(
	    {
	      $group : {
		_id : null,
		totalWords: { $sum: "$length" }, // for your case use local.user_totalthings
		count: { $sum: 1 } // for no. of documents count
	      }
	    }, function(err, res)
	    {
	      gotAverage(results, res[0].count, res[0].totalWords);
	    }

	);
    }
    
    function gotAverage(results, docCount, totalWords)
    {
      //sorting results containing documents because why not...
      for(var i = 0;i < results.length; i++)
      {
	  if(results[i])
	  {
	    if(results[i].containingDocuments)
	    {
	      results[i].containingDocuments.sort(function(a, b){
		return b.count - a.count;
	      });
	      
	      //maybe get IDF(qi) here?
	      
	      results[i].IDF = function(){
		  var N = docCount;
		  var n = results[i].containingDocuments.length;
		  var internal = ((N - n + 0.5)/(n + 0.5));
		  return Math.log(internal);
		
	      }();
	      
	      
	      
	      
	    }
	  }
      }
      
      var avgDocLength = totalWords / docCount;
      //now we have query results with containing documents sorted by highest frequency of word
      //now we should have IDF scores?
      var i = 0; 
      var j = 0;

      var docArray = [];
      if(results[i])
      {
	var query = {"name": results[i].containingDocuments[j].docName};
	getDoc(query);
      }
      else{
	res.send(null);
      }
      
      function getDoc(query)
      {
	Document.findOne(query, function(err, res){
	  if(res){
	  var obj = res.toObject();
	  //for later
	  obj.score = 0;
	  
	  docArray[docArray.length] = obj;
	  
	  if(j < results[i].containingDocuments.length - 1)
	  {
	    
	    j++;
	    while(!results[i].containingDocuments[j] && j < results[i].containingDocuments.length)
	    {
	      j++;
	    }
	    query = {"name": results[i].containingDocuments[j].docName};
	    getDoc(query);

	  }
	  else if(i < results.length - 1){
	    i++;
	    j = 0;
	    if(results[i])
	    {
	      query = {"name": results[i].containingDocuments[j].docName};
	      getDoc(query);
	    }
	    else{
	      proceed();
	    }
	  }
	  }
	});
	
      }

      	//this sucks
      function getDocument(name)
      {
	for(var i = 0; i < docArray.length; i++)
	{
	  if(docArray[i].name === name)
	  {
	    return docArray[i];
	  }
	}
	return null;
      }

      
      function proceed(){
	//now we have array of documents and their lengths
	for(var i = 0; i < results.length; i++)
	{
	  if(results[i])
	  {
	    for(var j = 0; j < results[i].containingDocuments.length; j++)
	    {
	      var tempDoc = results[i].containingDocuments[j];
	      var storedDoc = getDocument(tempDoc.docName);
	      var score = (tempDoc.count * (1.2 + 1));
	      score = score/ (tempDoc.count + 1.2 * (1-0.75 + 0.75 * (storedDoc.length/avgDocLength)));
	      storedDoc.score += score;
	    }
	  }
	}
	
	docArray.sort(function(a, b){
	  b.score - a.score
	});
	
	var returnArray = [];
	for(var i = 0; i < 10; i++)
	{
	  returnArray[i] = docArray[i];
	}
	res.send(returnArray);
      }
      
    }
      
      

      
    
     
});


//this sucks.. should be in a module
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

app.listen(3000);
console.log('app listening');












//put this shit in a module


/*
 * String method to remove stop words
 * Written by GeekLad http://geeklad.com
 * Stop words obtained from http://www.lextek.com/manuals/onix/stopwords1.html
 *   Usage: string_variable.removeStopWords();
 *   Output: The original String with stop words removed
 */
String.prototype.removeStopWords = function() {
    var x;
    var y;
    var word;
    var stop_word;
    var regex_str;
    var regex;
    var cleansed_string = this.valueOf();
    var stop_words = new Array(
        'a',
        'about',
        'above',
        'across',
        'after',
        'again',
        'against',
        'all',
        'almost',
        'alone',
        'along',
        'already',
        'also',
        'although',
        'always',
        'among',
        'an',
        'and',
        'another',
        'any',
        'anybody',
        'anyone',
        'anything',
        'anywhere',
        'are',
        'area',
        'areas',
        'around',
        'as',
        'ask',
        'asked',
        'asking',
        'asks',
        'at',
        'away',
        'b',
        'back',
        'backed',
        'backing',
        'backs',
        'be',
        'became',
        'because',
        'become',
        'becomes',
        'been',
        'before',
        'began',
        'behind',
        'being',
        'beings',
        'best',
        'better',
        'between',
        'big',
        'both',
        'but',
        'by',
        'c',
        'came',
        'can',
        'cannot',
        'case',
        'cases',
        'certain',
        'certainly',
        'clear',
        'clearly',
        'come',
        'could',
        'd',
        'did',
        'differ',
        'different',
        'differently',
        'do',
        'does',
        'done',
        'down',
        'down',
        'downed',
        'downing',
        'downs',
        'during',
        'e',
        'each',
        'early',
        'either',
        'end',
        'ended',
        'ending',
        'ends',
        'enough',
        'even',
        'evenly',
        'ever',
        'every',
        'everybody',
        'everyone',
        'everything',
        'everywhere',
        'f',
        'face',
        'faces',
        'fact',
        'facts',
        'far',
        'felt',
        'few',
        'find',
        'finds',
        'first',
        'for',
        'four',
        'from',
        'full',
        'fully',
        'further',
        'furthered',
        'furthering',
        'furthers',
        'g',
        'gave',
        'general',
        'generally',
        'get',
        'gets',
        'give',
        'given',
        'gives',
        'go',
        'going',
        'good',
        'goods',
        'got',
        'great',
        'greater',
        'greatest',
        'group',
        'grouped',
        'grouping',
        'groups',
        'h',
        'had',
        'has',
        'have',
        'having',
        'he',
        'her',
        'here',
        'herself',
        'high',
        'high',
        'high',
        'higher',
        'highest',
        'him',
        'himself',
        'his',
        'how',
        'however',
        'i',
        'if',
        'important',
        'in',
        'interest',
        'interested',
        'interesting',
        'interests',
        'into',
        'is',
        'it',
        'its',
        'itself',
        'j',
        'just',
        'k',
        'keep',
        'keeps',
        'kind',
        'knew',
        'know',
        'known',
        'knows',
        'l',
        'large',
        'largely',
        'last',
        'later',
        'latest',
        'least',
        'less',
        'let',
        'lets',
        'like',
        'likely',
        'long',
        'longer',
        'longest',
        'm',
        'made',
        'make',
        'making',
        'man',
        'many',
        'may',
        'me',
        'member',
        'members',
        'men',
        'might',
        'more',
        'most',
        'mostly',
        'mr',
        'mrs',
        'much',
        'must',
        'my',
        'myself',
        'n',
        'necessary',
        'need',
        'needed',
        'needing',
        'needs',
        'never',
        'new',
        'new',
        'newer',
        'newest',
        'next',
        'no',
        'nobody',
        'non',
        'noone',
        'not',
        'nothing',
        'now',
        'nowhere',
        'number',
        'numbers',
        'o',
        'of',
        'off',
        'often',
        'old',
        'older',
        'oldest',
        'on',
        'once',
        'one',
        'only',
        'open',
        'opened',
        'opening',
        'opens',
        'or',
        'order',
        'ordered',
        'ordering',
        'orders',
        'other',
        'others',
        'our',
        'out',
        'over',
        'p',
        'part',
        'parted',
        'parting',
        'parts',
        'per',
        'perhaps',
        'place',
        'places',
        'point',
        'pointed',
        'pointing',
        'points',
        'possible',
        'present',
        'presented',
        'presenting',
        'presents',
        'problem',
        'problems',
        'put',
        'puts',
        'q',
        'quite',
        'r',
        'rather',
        'really',
        'right',
        'right',
        'room',
        'rooms',
        's',
        'said',
        'same',
        'saw',
        'say',
        'says',
        'second',
        'seconds',
        'see',
        'seem',
        'seemed',
        'seeming',
        'seems',
        'sees',
        'several',
        'shall',
        'she',
        'should',
        'show',
        'showed',
        'showing',
        'shows',
        'side',
        'sides',
        'since',
        'small',
        'smaller',
        'smallest',
        'so',
        'some',
        'somebody',
        'someone',
        'something',
        'somewhere',
        'state',
        'states',
        'still',
        'still',
        'such',
        'sure',
        't',
        'take',
        'taken',
        'than',
        'that',
        'the',
        'their',
        'them',
        'then',
        'there',
        'therefore',
        'these',
        'they',
        'thing',
        'things',
        'think',
        'thinks',
        'this',
        'those',
        'though',
        'thought',
        'thoughts',
        'three',
        'through',
        'thus',
        'to',
        'today',
        'together',
        'too',
        'took',
        'toward',
        'turn',
        'turned',
        'turning',
        'turns',
        'two',
        'u',
        'under',
        'until',
        'up',
        'upon',
        'us',
        'use',
        'used',
        'uses',
        'v',
        'very',
        'w',
        'want',
        'wanted',
        'wanting',
        'wants',
        'was',
        'way',
        'ways',
        'we',
        'well',
        'wells',
        'went',
        'were',
        'what',
        'when',
        'where',
        'whether',
        'which',
        'while',
        'who',
        'whole',
        'whose',
        'why',
        'will',
        'with',
        'within',
        'without',
        'work',
        'worked',
        'working',
        'works',
        'would',
        'x',
        'y',
        'year',
        'years',
        'yet',
        'you',
        'young',
        'younger',
        'youngest',
        'your',
        'yours',
        'z'
    )
         
    // Split out all the individual words in the phrase
    words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g)
 
    if(words)
    {
    // Review all the words
    for(x=0; x < words.length; x++) {
        // For each word, check all the stop words
        for(y=0; y < stop_words.length; y++) {
            // Get the current word
            word = words[x].replace(/\s+|[^a-z]+/ig, "");   // Trim the word and remove non-alpha
             
            // Get the stop word
            stop_word = stop_words[y];
             
            // If the word matches the stop word, remove it from the keywords
            if(word.toLowerCase() == stop_word) {
                // Build the regex
                regex_str = "^\\s*"+stop_word+"\\s*$";      // Only word
                regex_str += "|^\\s*"+stop_word+"\\s+";     // First word
                regex_str += "|\\s+"+stop_word+"\\s*$";     // Last word
                regex_str += "|\\s+"+stop_word+"\\s+";      // Word somewhere in the middle
                regex = new RegExp(regex_str, "ig");
             
                // Remove the word from the keywords
                cleansed_string = cleansed_string.replace(regex, " ");
            }
        }
    }
    }
    else{
      return "";
    }
    return cleansed_string.replace(/^\s+|\s+$/g, "");
}