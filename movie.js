function Movie(jsonMovie, local, title ){
	var jsonObj = JSON.parse(jsonMovie);
	if (local)
	{
		this.adult = jsonObj.adult;
		this.cache_date = jsonObj.cache_date;
		this.id = jsonObj.id;
		this.title = jsonObj.title;
		this.original_title = jsonObj.original_title;
		this.release_date = jsonObj.release_date;
		this.total_results = jsonObj.total_results;
		this.vote_average = jsonObj.vote_average;
		this.vote_count = jsonObj.vote_count;
	}
	else
	{
		if (jsonObj.total_results > 0)
		{
			var value = 0;
			var movObj = jsonObj.results[0];
			var maxValue = jsonObj.results[0].popularity;
			logger("array"+JSON.stringify(jsonObj.results) );
			// storing the movie with max popularity
			for (var i=1; i<jsonObj.total_results; i++)
			{
				if (jsonObj.results[i].popularity!== null && jsonObj.results[i].popularity!== undefined)
				{
					break;
				}
				logger("popularity: "+jsonObj.results[i].popularity);
				if (jsonObj.results[i].popularity > maxValue) {
					movObj = jsonObj.results[i];
					maxValue = jsonObj.results[i].popularity;
				}
			}
						
			this.adult = movObj.adult;
			this.cache_date = Math.round(new Date()/1000) + cacheFound;; // recalculate
			this.id = movObj.id;
			this.title = title;
			this.original_title = movObj.original_title;
			this.release_date = movObj.release_date;
			this.total_results = jsonObj.total_results;
			this.vote_average = movObj.vote_average;
			this.vote_count = movObj.vote_count;
		}
		else
		{
			this.cache_date = Math.round(new Date()/1000) + cacheNotFound;
		}
	}
}

Movie.prototype.saveLocal = function(key){
	localStorage.setItem(key, JSON.stringify(this));
}