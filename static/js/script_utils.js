const googleTranslateBaseUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&dt=t&dt=bd&dj=1";

var allScripts = [];
var wordlist = [];
var countriesIso2 = {};
var scriptsByCountry = {};

var mapSVGText = "";

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

// Populate arrays/objects
	for (var currentScript in allScripts) {
		for (var currentCountry in allScripts[currentScript].countries) {
			var countryCode = allScripts[currentScript].countries[currentCountry];

			if (countryCode in scriptsByCountry) {
				scriptsByCountry[countryCode].push(allScripts[currentScript]["id"]);
			} else {
				scriptsByCountry[countryCode] = [ allScripts[currentScript]["id"] ];
			}
		}
	}

var request = new XMLHttpRequest();
request.open("GET", "static/world.svg", false);
request.onload = function() {
	mapSVGText = request.responseText;
}
request.send(null);

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

function mapHighlightCountries(svg, countryCodes) {
	for (var currentCountry in countryCodes) {
		var countryCode = countryCodes[currentCountry];
		var currentCountrySVGElement = svg.querySelector("#" + countryCode);

		if(currentCountrySVGElement != null) {
			currentCountrySVGElement.classList.add("highlighted");
		}
	}
}

function mapZoomToCountries(svg, countryCodes) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  countryCodes.forEach(code => {
    const el = svg.getElementById(code);
    if (!el) return;

    const bbox = el.getBBox();

    minX = Math.min(minX, bbox.x);
    minY = Math.min(minY, bbox.y);
    maxX = Math.max(maxX, bbox.x + bbox.width);
    maxY = Math.max(maxY, bbox.y + bbox.height);
  });

  const padding = 20;

  const width = maxX - minX;
  const height = maxY - minY;

  svg.setAttribute(
    "viewBox",
    `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`
  );
}

function initNewMap(clickFunction = function() {}) {
	var map = document.createElement("div");
	map.innerHTML = mapSVGText;
	map.classList.add("map");
	
	for (var currentPath in map.querySelector("svg").querySelectorAll("g")) {
		var path = map.querySelector("svg").querySelectorAll("g")[currentPath];

		if (path.nodeName == "g" && path.id != null) {
			var tooltip = document.createElementNS("http://www.w3.org/2000/svg", "title");
			tooltip.innerHTML = countriesIso2[path.id];
			path.appendChild(tooltip);
		}

		path.onclick = clickFunction;
	}

	return map;
}

function initNewScriptMap(scriptId, clickFunction = function() {}) {
	var map = initNewMap(clickFunction);

	mapHighlightCountries(map.querySelector("svg"), allScripts[scriptId].countries);

	return map;
}