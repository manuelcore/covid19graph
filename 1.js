var dataHeatmap = [];//date, [[lat,lon],[lat,lon],...]
var markerArray = [];
var rezJSON2 = {}; //data from  https://datelazi.ro/
function loadJSONData(){
	//open file
	var input = document.createElement('input');
	input.type = 'file';

	input.onchange = e => {
		var file = e.target.files[0]; // getting the file reference
		// setting up the reader
		var reader = new FileReader();
		reader.readAsText(file); // read JSON as text
		reader.onload = readerEvent => {
			var content = readerEvent.target.result; 
			testJSONParse2(JSON.parse(content));
		}

	}

	input.click();

}
function openCSVFile() { //open csv file
	var input = document.createElement('input');
	input.type = 'file';

	input.onchange = e => {
		var file = e.target.files[0]; // getting the file reference
		// setting up the reader
		var reader = new FileReader();
		reader.readAsText(file); // read csv as text
		reader.onload = readerEvent => {
			var content = readerEvent.target.result; 
			var rez = processCSVData(content);
		}

	}

	input.click();
}

function helpFunctionJSON(){
	alert('1. To get new JSON data go to: https://datelazi.ro/ and press the "Descarca date" button\n' + 
	'2. Load the resulted file using the "Load JSON data" button in this page');
}


function loadExistingData()
{//load data from up to 25 May 2020
testJSONParse2(JSON.parse(datele));
}

function testJSONParse2(data) {
	//find  historicalData
	$.each(data, function (key, val) {
		recursiveFunction(key, val)
	});
	//use countyInfectionsNumbers data
	resetRange();
	dataHeatmap = [];//clear old values
	$.each(rezJSON2, function (key, val) {
		//console.log(key, val);//key=date; val=list

		$.each(val, function (key2, val2) {
			//console.log(key2, val2);
			if (key2 == 'countyInfectionsNumbers') {
				console.log(key, val2);//key=date; val=
				$.each(val2, function (key3, val3) {
					//where key3 == AB and val3=300;

					//1. find location
					var lat = 0, lon = 0;
					$.each(coordCountyState, function (i1, v1) {
						if (v1[0] == key3) {
							lat = v1[1]; lon = v1[2];
							markerArray.push(L.latLng([lat, lon]));//used to automatically detect map bounds
							return false;//found coords
						}
					});
					if (lat != 0 || lon != 0) {
						//2. add all to heatmap and construct per day data
						for (var i = 0; i < parseInt(val3, 10); i++) {
							heat.addLatLng({ lat: lat, lng: lon });//default add all data to map
							//process data by day
							//a. find existing date & add to existing if found
							var found = 0;
							$.each(dataHeatmap, function (i2, v2) {
								if (v2[0] == key) {
									v2[1].push(L.latLng(lat, lon));
									found = 1;
								}
							});
							//b. add if new date
							if (found == 0) dataHeatmap.push([key, [L.latLng(lat, lon)]]);
						}
					}
				});
				
			};

		});

	});
	dataHeatmap.sort((a, b) => new Date(a[0]) - new Date(b[0]) );//sort by date ascending
	centerMap();
}

//iterate JSON
function recursiveFunction(key, val) {
	if (key == 'historicalData') { rezJSON2 = val; }
	var value = val['key2'];
	if (value instanceof Object) {
		$.each(value, function (key, val) {
			recursiveFunction(key, val)
		});
	}

}

//endtest


function resetRange() {
	markerArray = [];
	$("#sliderRange").prop("disabled", true);
	document.getElementById("demo").innerHTML = '0';
	try {
		if (dataHeatmap.length > 0) {
			heat.setLatLngs(dataHeatmap[document.getElementById("demo").innerHTML][1]); heat.redraw();
		}
	}
	catch (e) {
		console.log(e);
	}
}
function centerMap() {
	//var bounds = L.latLngBounds(markerArray);
	var markerBounds = L.latLngBounds(markerArray);
	mymap.fitBounds(markerBounds);
}

function processCSVData(allText) {
	resetRange();
	dataHeatmap = [];//clear old values
	var allCSVlines = allText.split(/\r\n|\n/);//split rows

	$.each(allCSVlines, function (index, value) {
		var splitdata = value.split(',');//split one row
		//input: county/country, data (format:year/month/day), carantinati, infectati, decedati, vindecati
		//         0                   1                  2           3         4           5
		var targetColumn = 2;//carantinati - change here for different column
		//output lat,lon,carantinati
		var lat = 0, lon = 0;
		$.each(coordCountyState, function (i1, v1) {
			if (v1[0] == splitdata[0]) {
				lat = v1[1]; lon = v1[2];
				markerArray.push(L.latLng([lat, lon]));//used to automatically detect map bounds
				return false;//found coords exit loop
			}
		});

		//add all to heatmap and construct per day data
		for (var i = 0; i < parseInt(splitdata[targetColumn], 10); i++) {
			heat.addLatLng({ lat: lat, lng: lon });//default add all data to map

			//process data by day
			//1. find existing date & add to existing if found
			var found = 0;
			$.each(dataHeatmap, function (i2, v2) {
				if (v2[0] == splitdata[1]) {
					v2[1].push(L.latLng(lat, lon));
					found = 1;
				}
			});
			//2. add if new date
			if (found == 0) dataHeatmap.push([splitdata[1], [L.latLng(lat, lon)]]);
		}
	});
	dataHeatmap.sort((a, b) => new Date(a[0]) - new Date(b[0]) );//sort by date ascending
	centerMap();
}

function helpFunction() {
	alert("1. load data from csv file (coma separated values)\n" + "2. columns are: County (as found in judcoord.js) or country (https://developers.google.com/public-data/docs/canonical/countries_csv) , date (format: year/month/day), number_of_cases\n" +
		"3. all the data will be placed in the heatmap; to select day use checkbox and slider\n" +
		"4. use included sampledata.txt for reference!");
}


//init leaflet map with default zoom on Romania
var mymap = L.map('mapid').setView([46.206448, 24.884033], 7);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1
}).addTo(mymap);


var popup = L.popup();

function onMapClick(e) {
	popup
		.setLatLng(e.latlng)
		.setContent("Location selected on map " + e.latlng.toString())
		.openOn(mymap);
}

mymap.on('click', onMapClick);
//document.getElementById("demo").innerHTML = "0"	
resetRange();

//https://github.com/Leaflet/Leaflet.heat	
var heat = L.heatLayer([
	[50.5, 30.5, 0.2] // lat, lng, intensity
], { radius: 50 }).addTo(mymap);
var draw = true;




//create slider
var slider = document.getElementById("sliderRange");
var output = document.getElementById("demo");
//output.innerHTML = slider.value; // Display the default slider value

// Update value on action
slider.oninput = function () {
	output.innerHTML = this.value;

	if (this.value < dataHeatmap.length) { heat.setLatLngs(dataHeatmap[this.value][1]); heat.redraw(); document.getElementById("demoday").innerHTML = dataHeatmap[this.value][0]; }
	else console.log("no data");//for days outside data range
}

$('#perday').on('change', function () {
	if ($(this).is(':checked')) {
		$("#sliderRange").prop("disabled", false);
		heat.setLatLngs(dataHeatmap[document.getElementById("demo").innerHTML][1]); heat.redraw();
	}
	else {//not checked
		resetRange();
	}
});
