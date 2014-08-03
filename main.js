var enableLog = true;
var i = 0;
var cacheFound = 24*3600;
var cacheNotFound = 24*3600;
var ratingImage = chrome.extension.getURL("img/rating.png");
var starImage = chrome.extension.getURL("img/stars10.png");
var youtubeUrl = "https://www.youtube.com/watch?v=";

var dataPopbox = '<div id="pop1" class="popbox"><h2>Stars plug-in <img src="'+starImage+'" alt="Stars extras" /></h2><p>Información extraída de TheMovieDB.org.</p></div>';

var moveLeft = 0;
var moveDown = 0;
var typeMovie = '2';

function DOMModificationHandler(){
    $(this).unbind('DOMSubtreeModified.event1');
	logger("DOMSubtreeModifiedHandler");
    setTimeout(function(){
        updateMoviesList();
		// once
		$('.thumbList').bind('DOMSubtreeModified.event1',DOMModificationHandler);
		//$('div #Title').bind('DOMSubtreeModified.event1',DOMModificationHandler);
		//$('div .poster').bind('DOMSubtreeModified.event1',DOMModificationHandler);
    },1000);
}

function DOMModificationHandlerRecommends(){
    $(this).unbind('DOMSubtreeModified.event2');
	logger("DOMModificationHandlerRecommends");
    setTimeout(function(){
        updateMoviesList();
		// once
		$('#SectionTabbedHome').bind('DOMSubtreeModified.event2',DOMModificationHandlerRecommends);
		//$('div .poster').bind('DOMSubtreeModified.event1',DOMModificationHandler);
    },1000);
}

window.addEventListener('load', function (e) {

  //$("body").append(dataPopbox);
//function updateRates(){
  var currentUrl = document.URL;
  if (currentUrl.indexOf('Movie/ProductDetails') > -1)
  {
	var movieId = $("#ProductTypeID").attr('productid');
	var productType = $("#ProductTypeID").val();
	if (productType == 'Movie'){	
		var storedInfo = localStorage.getItem(movieId);
		var loadedMovie = new Movie(storedInfo, true);
		logger('movie loaded');
		if (loadedMovie !== null && loadedMovie !== undefined && loadedMovie.original_title !== undefined)
		{
			var extraInfoNode = "";
			if (loadedMovie.original_title !== null && loadedMovie.original_title !== undefined)
			{
				extraInfoNode += '<dt>Título Original:</dt><dd>'+loadedMovie.original_title+' <img src="'+starImage+'" class="starsPopup" alt="Stars extras" data-popbox="pop1"></dd>';
			}
			
			if (isValidDate(loadedMovie.release_date))
			{
				var releaseDateObject = new Date(loadedMovie.release_date);
				var d = releaseDateObject.getDate();
				var m = releaseDateObject.getMonth();
				var y = releaseDateObject.getFullYear();
				extraInfoNode += '<dt>Fecha de estreno:</dt><dd>'+d+'-'+(m+1)+'-'+y+' <img src="'+starImage+'" class="starsPopup" alt="Stars extras" data-popbox="pop1"></dd>';
			}
			
			var linkYoutube = '';
			
			
			if ($(".actions").find("li .btnTrailer").length === 0)
			{
				logger("no trailer");
				if (loadedMovie.trailer !== null && loadedMovie.trailer !== undefined)
				{
					linkYoutube = youtubeUrl + loadedMovie.trailer; //youtubeUrl+jsonTrailer.youtube[0].source;
					var extraTrailer = '<li><a tag-type="trailerbutton" id="divTraileStars" href="'+linkYoutube+'" title="Tráiler" class="btnTrailer">Tráiler&nbsp<img src="'+starImage+'" class="starsPopup" alt="Stars extras" data-popbox="pop1"></a></li>';
					$(".actions").prepend(extraTrailer);
					$("#divTraileStars").YouTubePopup({hideTitleBar: true, showBorder: true});
				}
				else
				{
					var extraTrailer = '<li style="display: none;" id="liDivTraileStars" ><a tag-type="trailerbutton" id="divTraileStars" href="#linkYoutube" title="Tráiler" class="btnTrailer">Tráiler&nbsp<img src="'+starImage+'" class="starsPopup" alt="Stars extras" data-popbox="pop1"></a></li>';
					$(".actions").prepend(extraTrailer);
					$("#divTraileStars").YouTubePopup({hideTitleBar: true, showBorder: true});
					
					theMovieDb.movies.getTrailers({"id":loadedMovie.id, "language":"es"}, 
						function successCB(data) {
							//console.log("Success callback: " + data);
							logger(data);
							var response = manageResponseTrailers(data);
							if (response != '')
							{
								var linkYoutube = youtubeUrl + response;
								loadedMovie.trailer = response;
								loadedMovie.saveLocal(movieId);
								
								$('#divTraileStars').attr("href", linkYoutube);
								$('#liDivTraileStars').show();
							}
							else
							{
								console.log("Getting eng trailer");
								theMovieDb.movies.getTrailers({"id":loadedMovie.id, "language":"en"}, 
								function successCB(data) {
									//console.log("Success callback: " + data);
									logger(data);
									var response = manageResponseTrailers(data);
									if (response != '')
									{
										var linkYoutube = youtubeUrl + response;
										loadedMovie.trailer = response;
										loadedMovie.saveLocal(movieId);
										
										$('#divTraileStars').attr("href", linkYoutube);
										$('#liDivTraileStars').show();
									}
								}, errorCB);
							}
						}, errorCB);
				}
			}

			$("div .detailsInfo").find(".cast").prepend(extraInfoNode);
			
			$(".ratingBox").css('margin',0); // ???
			
			var extraRateNode = '<li><div class="extraRateNode">Valoración STARS <img src="'+starImage+'" class="starsPopup" alt="Stars extras" data-popbox="pop1"></div><div class="rateNode">'+loadedMovie.vote_average+'<span style="font-size:10px;"> ('+loadedMovie.vote_count+' votos)</span></div></li>';
			$(".actions").prepend(extraRateNode);
		}
		
	};
	hoverText();
  }
  else if (currentUrl.indexOf('LiveGuide') > -1)
  {}
  else if (currentUrl.indexOf('Search/SearchResult') > -1)
  {}
  else
  {
	// movies list
    updateMoviesList();
	//after document-load
	$('.thumbList').bind('DOMSubtreeModified.event1',DOMModificationHandler);
	$('#SectionTabbedHome').bind('DOMSubtreeModified.event2',DOMModificationHandlerRecommends);
	//$('div .poster').bind('DOMSubtreeModified.event1',DOMModificationHandler);
	}
		
}, false);

function hoverText()
{
	$('.starsPopup').hover(function(e) {   
        var target = '#' + ($(this).attr('data-popbox'));
        $(target).show();
        moveLeft = $(this).outerWidth();
        moveDown = ($(target).outerHeight() / 2);
    }, function() {
        var target = '#' + ($(this).attr('data-popbox'));
        $(target).hide();
    });
 
    $('.starsPopup').mousemove(function(e) {
        var target = '#' + ($(this).attr('data-popbox'));
         
        leftD = e.pageX + parseInt(moveLeft);
        maxRight = leftD + $(target).outerWidth();
        windowLeft = $(window).width() - 40;
        windowRight = 0;
        maxLeft = e.pageX - (parseInt(moveLeft) + $(target).outerWidth() + 20);
         
        if(maxRight > windowLeft && maxLeft > windowRight)
        {
            leftD = maxLeft;
        }
     
        topD = e.pageY - parseInt(moveDown);
        maxBottom = parseInt(e.pageY + parseInt(moveDown) + 20);
        windowBottom = parseInt(parseInt($(document).scrollTop()) + parseInt($(window).height()));
        maxTop = topD;
        windowTop = parseInt($(document).scrollTop());
        if(maxBottom > windowBottom)
        {
            topD = windowBottom - $(target).outerHeight() - 20;
        } else if(maxTop < windowTop){
            topD = windowTop + 20;
        }
     
        $(target).css('top', topD).css('left', leftD);
     
    });
}

function updateMoviesList()
{
	$("div .poster").each(function()
	{
		var $that = $(this);
		//logger('ping');
		if (!$that.find('.movieVote').length) 
		{
		// not found!
			var movieId = $that.find('span.status').attr('product-id');
			logger("MovieId: "+movieId);
			var productType = $that.find('span.status').attr('product-type');
			logger("Product-type: "+productType);
			
			if (productType == typeMovie)
			{
				logger("isMovie");
				var storedJson = localStorage.getItem(movieId);
				logger("movieId "+movieId);
				
				if (storedJson !== null && storedJson !== undefined)
				{
					var movie = new Movie(storedJson, true);
					
					//calculating cache
					logger(Math.round(new Date()/1000));
					logger(movie.cache_date);
					
					if (movie.cache_date < Math.round(new Date()/1000))
					{
						// cache should be renewed
						logger("renew cache");

						var queryTitle = movie.title;
						if (queryTitle == undefined || queryTitle == null)
						{
							var filmName = $that.find("h3").text();
							var filmName2 = filmName.split("(Subtitulada)");
							queryTitle = filmName2[0].trim();
						}
						logger("queryTitle :"+queryTitle);
						theMovieDb.search.getMovie({"query":encodeURIComponent(queryTitle)}, 
						function successCB(data) {
							//console.log("Success callback: " + data);
							var movieUpdated = new Movie(data, false, queryTitle);
							movieUpdated.saveLocal(movieId);
							if (movieUpdated.total_results > 0)
							{
								paintRating($that, movieUpdated.vote_average, movieUpdated.vote_count);
							}
							// else
							// {
								// paintRating($that, 0, 0);
							// }
						}, errorCB);
					}
					else
					{
						logger("cache not expired");
						if (movie.total_results > 0)
						{
							paintRating($that, movie.vote_average, movie.vote_count);
						}
						// else
						// {
							// paintRating($that, 0, 0);
						// }
					}
				}
				else
				{
					var filmName = $(this).find("h3").text();
					var filmName2 = filmName.split("(Subtitulada)");
					filmName = filmName2[0].trim();
					logger("not found: "+filmName);
					logger("queryTitle :"+filmName);
					theMovieDb.search.getMovie({"query":encodeURIComponent(filmName)}, 
						function successCB(data) {
							//console.log("Success callback: " + data);
							var movie = new Movie (data, false, filmName);
							movie.saveLocal(movieId);
							if (movie.total_results > 0)
							{
								paintRating($that, movie.vote_average, movie.vote_count);
							}
							// else
							// {
								// paintRating($that, 0, 0);
							// }
						}, errorCB);
				}
			}
		}
	});
	hoverText();
};

function errorCB(data) {
    // console.log("Error callback: " + data);
		logger("Error callback: " + data);
    };

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
	var movieVote = '<div class="movieVote"><div class="movieVoteMid">Valoración: &nbsp<span class="movieVoteMidPlus">'+rating+'</span>&nbsp(<img src="'+starImage+'" class="starsPopup" class="starsPopup" alt="Stars extras" data-popbox="pop1">x'+ count+')</div>';
	var $nodeA = $node.find('a').eq(0);//.eq(0);
	$nodeA.append(movieVote);
}

function playLol(url)
{
logger("play"+url);
}