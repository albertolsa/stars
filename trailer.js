function manageResponseTrailers(jsonTrailers)
{
	var jsonObj = JSON.parse(jsonTrailers);
	var source = '';
	if (jsonObj.youtube.length > 0)
	{
		source = jsonObj.youtube[0].source;
	}
	return source;
}