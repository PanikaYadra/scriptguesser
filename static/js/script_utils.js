var allScripts = [];

const googleTranslateBaseUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&dt=t&dt=bd&dj=1";

$.getJSON("static/scripts.json", function(json) {
	allScripts = json;
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