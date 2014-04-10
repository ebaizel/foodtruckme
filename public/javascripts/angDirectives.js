angular.module('truckApp.directives', []).
	directive('gmap', function() {
		return {
			restrict: 'E',
			replace: true,
			template: '<div></div>',
			link: function(scope, element, attrs) {
	            
	            var myOptions = {
	                zoom: 14,
	                center: new google.maps.LatLng(37.7749, -122.419),
	                mapTypeId: google.maps.MapTypeId.ROADMAP
	            };
	            var map = new google.maps.Map(document.getElementById(attrs.id), myOptions);
				var geocoder = new google.maps.Geocoder();
				var infowindow = new google.maps.InfoWindow();

				google.maps.event.addListener(map, 'idle', function() {					
					geocoder.geocode({'latLng': map.getCenter()}, function(results, status) {
						if (status == "OK") {  // sometimes we get over_query_limit
							var location = results[0].geometry.location;
							scope.lat = location.d;
							scope.lon = location.e;
							scope.map = map;

							// if it's the first time, or auto move, then refresh
							if (scope.autoMove || !scope.trucks) {
								scope.reset();
								scope.refreshMarkers();
							}
						} else {
							console.log("error from google: " + status);
						}
					});
				});
        	}
		}
	});