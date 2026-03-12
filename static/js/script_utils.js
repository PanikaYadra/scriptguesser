const googleTranslateBaseUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&dt=t&dt=bd&dj=1";

const BASE_PATH = location.hostname.endsWith("github.io") ? "scriptguesser/" : "/";
const FOLDER_STATIC = BASE_PATH + "static/";
const FOLDER_JSON = FOLDER_STATIC + "json/";

const confusabilities = [
	"Not Confusable",
	"Very Low",
	"Low",
	"Moderate",
	"High",
	"Very High",
	"Extremely High",
	"Unintelligible Unless Spoken",
	"Unintelligible"
]

var allScripts = [];
var wordlist = [];
var allPresets = {};
var countriesIso2 = {};
var scriptsByCountry = {};
var orderedScriptsByCountryIsos = [];

var mapSVGText = "";

// Load JSON files
$.ajaxSetup({
   	async: false
});

$.getJSON(FOLDER_JSON + "scripts.json", function(json) {
	allScripts = json;
});

$.getJSON(FOLDER_JSON + "countries_iso2.json", function(json) {
	countriesIso2 = json;
});

$.getJSON(FOLDER_JSON + "wordlist.json", function(json) {
	wordlist = json;
});

$.getJSON(FOLDER_JSON + "presets.json", function(json) {
	allPresets = json;
});

// Prepare relative paths
function asset(path) {

}

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

// Sort scripts by country array
orderedScriptsByCountryIsos = Object.keys(scriptsByCountry);
orderedScriptsByCountryIsos.sort(function (a, b) {
	if (countriesIso2[a] > countriesIso2[b]) return 1;
	if (countriesIso2[a] < countriesIso2[b]) return -1;
	return 0;
});

var request = new XMLHttpRequest();
request.open("GET", FOLDER_STATIC + "world.svg", false);
request.onload = function() {
	mapSVGText = request.responseText;
}
request.send(null);

function createHTMLElement(type, className = "", innerHTML = "") {
	var element = document.createElement(type);
	element.innerHTML = innerHTML;
	element.className = className;

	return element;
}

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

function mapHighlightCountries(svg, countryCodes, clearPriorHighlights = true) {
	if (clearPriorHighlights) {
		svg.querySelectorAll("g").forEach(el => el.classList.remove("highlighted"));
	}

	for (var currentCountry in countryCodes) {
		var countryCode = countryCodes[currentCountry];
		var currentCountrySVGElement = svg.querySelector("#" + countryCode);

		if(currentCountrySVGElement != null) {
			currentCountrySVGElement.classList.add("highlighted");
		}
	}
}

function mapZoomToCountries(svg, countryCodes, padding = 50) {
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

  const width = maxX - minX;
  const height = maxY - minY;

  svg.setAttribute(
    "viewBox",
    `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`
  );

  svg.padding = padding;
}

function initNewMap(clickFunction = function() {}, isZoomable = true) {
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

	if (isZoomable) {
		map.querySelector("svg").onwheel = function(e) {
			const step = 15;
			const minPadding = 0;
			const maxPadding = 1000;
	
			var oldPadding = this.padding;
			var newPadding = 0;
			var oldViewBox = this.viewBox.baseVal;
	
			e.preventDefault();
	
			if (e.deltaY > 0 || e.deltaX < 0) {
				// Zoom out
				newPadding = Math.min(maxPadding, oldPadding + step);
			} else if (e.deltaY < 0 || e.deltaX > 0) {
				// Zoom in
				newPadding = Math.max(minPadding, oldPadding - step);
			}
	
			this.setAttribute("viewBox", `${oldViewBox.x + oldPadding - newPadding} ${oldViewBox.y + oldPadding - newPadding} ${oldViewBox.width - oldPadding * 2 + newPadding * 2} ${oldViewBox.height - oldPadding * 2 + newPadding * 2}`);
			this.padding = newPadding;
		}
	}

	return map;
}

function initNewScriptMap(scriptId, clickFunction = function() {}) {
	var map = initNewMap(clickFunction);

	mapHighlightCountries(map.querySelector("svg"), allScripts[scriptId].countries);

	return map;
}

function compareScripts(scripts, targetNode = null) {
	for (var currentScript of scripts) {
		if (!allScripts[currentScript]) {
			console.error(`Invalid script '${currentScript}'.`);
			return;
		}
	}

	var row = document.createElement("div");
	row.className = "row text-center";

	for (var currentScript of scripts) {
		var thisScript = allScripts[currentScript];

		var colScript = document.createElement("div");
		colScript.className = "col";

		var lblScriptTitle = document.createElement("h3");
		lblScriptTitle.className = "";
		lblScriptTitle.textContent = thisScript.label;
		colScript.appendChild(lblScriptTitle);

		var containerScript = document.createElement("div");
		containerScript.className = "container bg-dark text-white";
		containerScript.textContent = thisScript.example_text;
		colScript.appendChild(containerScript);

		row.appendChild(colScript);
	}

	if(targetNode) {
		targetNode.innerHTML = "";
		targetNode.appendChild(row);
		return;
	}

	return row;
}

function scrollToHash(parentElement = document) {
	var target = parentElement.querySelector(window.location.hash);

	if (!target) {
		return;
	}

  var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - $(".navbar")[0].offsetHeight;

  window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
  });
}