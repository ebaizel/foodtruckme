// Gets radius from center of viewport to the NE corner

var map;
var trucks;
var infowindow;
var geocoder;

function getViewportRadius() {
	var bounds = map.getBounds();
	var radius = google.maps.geometry.spherical.computeDistanceBetween (bounds.getCenter(), bounds.getNorthEast());
	return (radius/1609.34);  //convert meters to miles
}

// Builds the content for the pop-up flags
function getTruckContent(truck) {
	var content = "";
	content += "<p><b>" + truck.name + "</b></p>";
	content += "<p>" + truck.address + "</p>";
	return content;
}

function refreshData() {
	var html = '';
	html += '<tr><td>'
}

function refreshMarkers(lon, lat) {
	$.get('/truck?status=APPROVED&limit=25&lon=' + lon + '&lat=' + lat, function(trucksdata) {
		for (var i=0; i < trucksdata.length; i++) {
			var position = new google.maps.LatLng(trucksdata[i]['loc']['lat'], trucksdata[i]['loc']['lon']);			
			var marker = new google.maps.Marker({
				position: position
			});
			marker.setMap(map);

			google.maps.event.addListener(marker, 'click', (function(marker, i) {
				return function() {
					infowindow.setContent(getTruckContent(trucksdata[i]));
					infowindow.open(map, marker);
				};
			})(marker, i));
		}
	})
}


$(function() {

	geocoder = new google.maps.Geocoder();
	infowindow = new google.maps.InfoWindow();

	var lat = 37.7749;
	var lon = -122.419;

	map = new google.maps.Map(document.getElementById('map_canvas'), {
	    zoom: 12,
	    center: new google.maps.LatLng(lat, lon),
	    mapTypeId: google.maps.MapTypeId.ROADMAP
	});

	google.maps.event.addListener(map, 'idle', function() {
			geocoder.geocode({'latLng': map.getCenter()}, function(results, status) {
				console.log('results are ', results);
				if (status == "OK") {  // sometimes we get over_query_limit
					var location = results[0].geometry.location;
					refreshMarkers(location.e, location.d);
				} else {
					console.log("error from google: " + status);
				}
			});
	});

	// var address = "San Francisco, CA";
	// var geocoder = new google.maps.Geocoder();
	// geocoder.geocode({'address' : address}, function(results, status) {
	
	// 	var lat = results[0]['geometry']['location'].lat();
	// 	var lon = results[0]['geometry']['location'].lng();

	// 	map = new google.maps.Map(document.getElementById('map_canvas'), {
	// 	    zoom: 12,
	// 	    center: new google.maps.LatLng(lat, lon),
	// 	    mapTypeId: google.maps.MapTypeId.ROADMAP
	// 	});

	// 	google.maps.event.addListener(map, 'bounds_changed', function() {
	// 		window.setTimeout(function() {
	// 			geocoder.geocode({'latLng': map.getCenter()}, function(results, status) {
	// 				if (status == "OK") {  // sometimes we get over_query_limit
	// 					address = results[0].formatted_address;
	// 					refreshMarkers();
	// 					//refreshMarkers(results[0].formatted_address);
	// 				} else {
	// 					console.log("error from google: " + status);
	// 				}
	// 			});
	// 		}, 1000);
	// 	});
	// });
});