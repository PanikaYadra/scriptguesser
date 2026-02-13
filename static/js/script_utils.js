const googleTranslateBaseUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&dt=t&dt=bd&dj=1";

var allScripts = [];
var wordlist = [];
var countriesIso2 = {};
var scriptsByCountry = {};

// Load JSON files
$.ajaxSetup({
   	async: false
});

$.getJSON("static/scripts.json", function(json) {
	allScripts = json;
});

$.getJSON("static/countries_iso2.json", function(json) {
	countriesIso2 = json;
});

$.getJSON("static/wordlist.json", function(json) {
	wordlist = json;
});


function translateSentence(destScript, sentence) {
	var destLang = destScript;
	var data = "";

	var request = new XMLHttpRequest();
	request.open("GET", googleTranslateBaseUrl + "&tl=" + destLang + "&q=" + encodeURI(sentence), false);
	request.onload = function() {
		data = JSON.parse(request.responseText);
	}
	request.send(null);

	if (request.status === 200) {
		res = request;
	} else {
		console.log("Failed to fetch translation.");
	}

	return data.sentences[0].trans;
}