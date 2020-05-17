var dataHeatmap = [];//date, [[lat,lon],[lat,lon],...]
var markerArray = [];
function resetRange() {
	markerArray = [];
	$( "#myRange" ).prop( "disabled", true );
	document.getElementById("demo").innerHTML='0';
	try{
		if(dataHeatmap.length>0){
		heat.setLatLngs(dataHeatmap[document.getElementById("demo").innerHTML][1]); heat.redraw();
		}
		}
	catch(e){
		console.log(e);
	}
}
function centerMap(){
	//var bounds = L.latLngBounds(markerArray);
	var markerBounds = L.latLngBounds(markerArray);
  mymap.fitBounds(markerBounds);
}

function processCSVData(allText) {
	resetRange();
	dataHeatmap = [];//clear old values
    var allCSVlines = allText.split(/\r\n|\n/);//split rows
    
	$.each( allCSVlines, function( index, value ){
    var splitdata = value.split(',');//split one row
	//input: county/country, data (format:day/month/year), carantinati, infectati, decedati, vindecati
	//         0                   1                  2           3         4           5
	var targetColumn = 2;//carantinati - change here for different column
	//output lat,lon,carantinati
	var lat=0,lon=0;
	$.each( coordCountyState, function( i1, v1 ){
		if(v1[0]==splitdata[0]){
			lat=v1[1];lon=v1[2];
			markerArray.push(L.latLng([lat, lon]));//used to automatically detect map bounds
			return false;//found coords exit loop
			}
	});
	
	//add all to heatmap and construct per day data
    for (var i=0;i<parseInt(splitdata[targetColumn], 10);i++)
	{
		heat.addLatLng({lat: lat, lng: lon});//default add all data to map
		
		//process data by day
		//1. find existing date & add to existing if found
		var found=0;
		$.each( dataHeatmap, function( i2, v2 ){
			if(v2[0]==splitdata[1]){
				v2[1].push(L.latLng(lat, lon));
				found=1;}
		});
		//2. add if new date
		if(found==0)dataHeatmap.push([splitdata[1],[L.latLng(lat, lon)]] );
	}
	});
   centerMap();
    console.log(dataHeatmap);
	//return dataHeatmap;
}

function myFunction() {
	alert("1. load data from csv file (coma separated values)\n" + "2. columns are: Judet(as found in judcoord.js) or country (https://developers.google.com/public-data/docs/canonical/countries_csv) , date (format:day/month/year), number\n"+
	"3. all the data will be placed in the heatmap; to select day use checkbox and slider");
    //document.getElementById("demo").style.color = "red";
	//heat.addLatLng({lat: 44.859763, lng: 24.889526});
}


//init leaflet map with default zoom
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
], {radius: 25}).addTo(mymap);
var draw = true;
/*
//draw on map test
mymap.on({
    movestart: function () { draw = false; },
    moveend:   function () { draw = true; },
    mousemove: function (e) {
        if (draw) {
            heat.addLatLng(e.latlng);
			console.log(e.latlng);
        }
    }
})
*/
function openFile(){
//open file
var input = document.createElement('input');
input.type = 'file';

input.onchange = e => { 
   var file = e.target.files[0]; // getting a hold of the file reference
   // setting up the reader
   var reader = new FileReader();
   reader.readAsText(file); // read csv as text
   // here we tell the reader what to do when it's done reading...
   reader.onload = readerEvent => {
      var content = readerEvent.target.result; // this is the content!
	  var rez=processCSVData(content);
   }

}

input.click();
}


//create slider
//https://www.w3schools.com/howto/howto_js_rangeslider.asp
var slider = document.getElementById("myRange");
var output = document.getElementById("demo");
//output.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value;
  
  if (this.value<dataHeatmap.length)
  {heat.setLatLngs(dataHeatmap[this.value][1]); heat.redraw(); document.getElementById("demoday").innerHTML = dataHeatmap[this.value][0];}
else console.log("no data");
}

$('#perday').on('change',function(){
    
    if ($(this).is(':checked')) {
		$( "#myRange" ).prop( "disabled", false );
		heat.setLatLngs(dataHeatmap[document.getElementById("demo").innerHTML][1]); heat.redraw();
	}
	else {//not checked
	resetRange();
	}
});
