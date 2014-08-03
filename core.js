//theMovieDB
//var result = '{"adult":false,"backdrop_path":"/f5BEkvAdZ7099HfsRcfftUMnkxY.jpg","id":10843,"original_title":"After Hours","release_date":"1985-09-13","poster_path":"/qpr5tRmvyx4rbv1gKMKbW1v5JUC.jpg","popularity":0.613379150091106,"title":"After Hours","vote_average":7.2,"vote_count":19,"cacheDate":1398895536,"found":"true"}';
//http://www.mcu.es/bbddpeliculas/back.do?cacheNum=3
//http://www.imdb.com/
// http://vipelis.com/filma/?id=257620

var enableLog = true;
var i = 0;
var cacheFound = 24*3600;
var cacheNotFound = 24*3600;
var ratingImage = chrome.extension.getURL("img/rating.png");

function DOMModificationHandler(){
    $(this).unbind('DOMSubtreeModified.event1');
    setTimeout(function(){
        updateMoviesList();
		// once
		$('div #Title').bind('DOMSubtreeModified.event1',DOMModificationHandler);
		//$('div .poster').bind('DOMSubtreeModified.event1',DOMModificationHandler);
    },1000);
}

window.addEventListener('load', function (e) {
//function updateRates(){
  var currentUrl = document.URL;
  if (currentUrl.indexOf('Movie/ProductDetails') > -1)
  {
	// movie details
	var filmName = $("div .secTitle").find("h1").text();
	//logger(filmName);
	//filmName = filmName.trim();
	var filmName2 = filmName.split("(Subtitulada)");
	//logger("filmName2:"+filmName2);
	filmName = filmName2[0].trim();
		
	var storedFilm = localStorage.getItem(encodeURIComponent(filmName));
	if (storedFilm !== null && storedFilm !== undefined)
	{
		var extraInfoNode = "";
		var objStoredFilm = JSON.parse(storedFilm);
		var originalTitle = objStoredFilm.original_title;
		if (originalTitle !== null && originalTitle !== undefined)
		{
			extraInfoNode += '<dt>Título Original:</dt><dd>'+originalTitle+'</dd>';
		}
		
		var releaseDate = objStoredFilm.release_date.trim();
		
		if (isValidDate(releaseDate))
		{
			var releaseDateObject = new Date(releaseDate);
			var d = releaseDateObject.getDate();
			var m = releaseDateObject.getMonth();
			var y = releaseDateObject.getFullYear();
			extraInfoNode += '<dt>Fecha de estreno:</dt><dd>'+d+'-'+m+'-'+y+'</dd>';
		}
		logger(extraInfoNode);
		$("div .detailsInfo").find(".cast").prepend(extraInfoNode);
		
		var voteAverage = objStoredFilm.vote_average;
		var voteCount = objStoredFilm.vote_count;
		
		$(".ratingBox").css('margin',0);
		
		var extraRateNode = '<li><div class="extraRateNode">Valoración TheMovieDB</div><div class="rateNode">'+voteAverage+'<span style="font-size:10px;"> ('+voteCount+' votos)</span></div></li>';
		$(".actions").prepend(extraRateNode);
	}
  }
  else if (currentUrl.indexOf('LiveGuide') > -1)
  {
  }
  else
  {
	// movies list
    updateMoviesList();
	//after document-load
	$('div #Title').bind('DOMSubtreeModified.event1',DOMModificationHandler);
	//$('div .poster').bind('DOMSubtreeModified.event1',DOMModificationHandler);
	}
}, false);

function updateMoviesList(){
	$("div .poster").each(function(){
	var $that = $(this);
 
	if (!$that.find('.movieVote').length) {
    // not found!
	
    //var imageb = $(this).find("img").attr("src");
    var filmName = $(this).find("h3").text();
   	var filmName2 = filmName.split("(Subtitulada)");
	filmName = filmName2[0].trim();
	//logger("filmName2:"+filmName2);
    //var imageb = $("img").find(image);//.attr("src");
   	var storedFilm;
	storedFilm = localStorage.getItem(encodeURIComponent(filmName));

	if (storedFilm !== null && storedFilm !== undefined)
	{
		var objStoredFilm = JSON.parse(storedFilm);
		logger("found at local");
		logger(storedFilm);
		logger(Math.round(new Date()/1000));
		
		if (objStoredFilm.cacheData < Math.round(new Date()/1000))
		{
			// cache should be renewed
			logger("renew cache");
			theMovieDb.search.getMovie({"query":encodeURIComponent(filmName)}, 
			function successCB(data) {
				//console.log("Success callback: " + data);
				objResult = JSON.parse(data);
				//console.log(objResult);
				if (objResult.total_results > 0)
				{
					var movieToStore = objResult.results[0];
					movieToStore.cacheDate = Math.round(new Date()/1000) + cacheFound;
					movieToStore.found = "true";
					
					var voteAverage = objResult.results[0].vote_average;
					var voteCount = objResult.results[0].vote_count;
					paintRating($that, voteAverage, voteCount);
					
					storeMovieToDB(encodeURIComponent(filmName),movieToStore);
				}
				else
				{
					var cacheDate = Math.round(new Date()/1000) + cacheNotFound;;
					var notFoundToStore = {"cacheDate": cacheDate, "found": "false"};
					paintRating($that, 0, 0);
					storeMovieToDB(encodeURIComponent(filmName),notFoundToStore);
				
				}
			}, errorCB);
		}
		else
		{
			logger("cache not expired");
			logger(objStoredFilm.found);
			if (objStoredFilm.found == "true")
			{
				var voteAverage = objStoredFilm.vote_average;
				var voteCount = objStoredFilm.vote_count;
				paintRating($that, voteAverage, voteCount);
			}
			else
			{
				logger("Lol");
				paintRating($that, 0, 0);
			}
		}
	}
	else
	{
		logger("not found: "+filmName);
		theMovieDb.search.getMovie({"query":encodeURIComponent(filmName)}, 
			function successCB(data) {
				logger("called API");
				//console.log("Success callback: " + data);
				objResult = JSON.parse(data);
				//console.log(objResult);
				if (objResult.total_results > 0)
				{
					var movieToStore = objResult.results[0];
					
					logger("objResult.total_results > 0");
					movieToStore.cacheDate = Math.round(new Date()/1000) + cacheFound;
					movieToStore.found = "true";
	
					storeMovieToDB(encodeURIComponent(filmName),movieToStore);
					var voteAverage = objResult.results[0].vote_average;
					var voteCount = objResult.results[0].vote_count;
					paintRating($that, voteAverage, voteCount);
					
				}
				else
				{
					logger("NOT objResult.total_results > 0");
					var cacheDate = Math.round(new Date()/1000) + cacheNotFound;;
					var notFoundToStore = {"cacheDate": cacheDate, "found": "false"};
					paintRating($that, 0, 0);
					storeMovieToDB(encodeURIComponent(filmName),notFoundToStore);
				
				}
			}, errorCB);
	}
}});
};

function errorCB(data) {
    // console.log("Error callback: " + data);
		logger("Error callback: " + data);
    };
	
function storeMovieToDB(key, value) {
       // chrome.storage.sync.set({key: value}, function() {console.log('Saved', key, value);});
        localStorage.setItem(key, JSON.stringify(value));//, function() {console.log('Saved', key, value);});		
}

function getMovieFromDB(key) {
    chrome.storage.sync.get(key, function (obj) {
       // console.log('Retrieving from internal DB: '+key, obj);
    });
}

function isValidDate(subject){
  //if (subject.match(/^(?:(0[1-9]|1[012])[\- \/.](0[1-9]|[12][0-9]|3[01])[\- \/.](19|20)[0-9]{2})$/)){
  if (subject.match(/^(?:(19|20)[0-9]{2})[\- \/.](0[1-9]|1[012])[\- \/.](0[1-9]|[12][0-9]|3[01])$/)){
    return true;
  }else{
    return false;
  }
}

function logger(toLog){
	if (enableLog)
	{
		console.log(toLog);
	}
}

function paintRating($node, rating, count){
	var movieVote = '<div class="movieVote2"><div class="movieVoteMid">Valoración: </div><div class="movieVotePlus">'+rating+'</div><div class="movieVoteMinus"> ('+count+')</div></div>';
	var $nodeA = $node.find('a').eq(0);
	$nodeA.append(movieVote);
}