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
	            scope.map = new google.maps.Map(document.getElementById(attrs.id), myOptions);
				var geocoder = new google.maps.Geocoder();

				google.maps.event.addListener(scope.map, 'idle', function() {
					scope.mapMoved();
				});
        	}
		}
	});