angular.module('truckApp.controllers', []).
	controller('TruckCtrl', function($scope, $http) {

		$scope.currentPage = 0;  // pagination
		$scope.limit = 10;  // search results to query for
		$scope.autoMove = false;  //redo search when map moves
		$scope.trucks = null;
		$scope.totalTrucks;
		$scope.address = 'San Francisco, CA';
		$scope.lat = 37.7749;
		$scope.lon = -122.419;
		$scope.nelat;
		$scope.nelon;
		$scope.swlat;
		$scope.swlon;

		$scope.toggleAutoMove = function() {
			$scope.autoMove = !($scope.autoMove);
		}

		$scope.reset = function() {
			$scope.currentPage = 0;
			$scope.trucks = null;
			$scope.totalTrucks = 0;
		}

		$scope.nextText = function() {
			return 'Next';
		}

		$scope.prevText = function() {
			return 'Prev';
		}

		$scope.displayTrucksNearUser = function() {

			if (navigator.geolocation) {

				$scope.flashMessage = 'Locating...';
				navigator.geolocation.getCurrentPosition(function(position) {

					$scope.flashMessage = '';

					$scope.lat = position.coords.latitude;
					$scope.lon = position.coords.longitude;
					$scope.map.setCenter(new google.maps.LatLng($scope.lat, $scope.lon));
					$scope.map.setZoom(14);
					$scope.mapMoved(true);
				});
			}
		}

		$scope.mapMoved = function(forceMove) {
			var viewBounds = $scope.map.getBounds();
			$scope.nelat = viewBounds.getNorthEast().lat();
			$scope.nelon = viewBounds.getNorthEast().lng();
			$scope.swlat = viewBounds.getSouthWest().lat();
			$scope.swlon = viewBounds.getSouthWest().lng();
			if (!$scope.trucks || $scope.autoMove || forceMove) {
				$scope.reset();
				$scope.refreshMarkers();
			}
		}

		$scope.reset();		

		$scope.displayTotalLong = function() {
			var from = ($scope.currentPage * $scope.limit) + 1;
			var to = (($scope.currentPage + 1) * $scope.limit);
			if (to > $scope.totalTrucks) {
				to = $scope.totalTrucks;
			}
			var result = 'Showing ' + from + '-' + to + ' of ' + $scope.totalTrucks;
			return result;
		}

		$scope.displayTotalShort = function() {
			var from = ($scope.currentPage * $scope.limit) + 1;
			var to = (($scope.currentPage + 1) * $scope.limit);
			if (to > $scope.totalTrucks) {
				to = $scope.totalTrucks;
			}
			var result = from + '-' + to + ' of ' + $scope.totalTrucks;
			return result;
		}

		$scope.hasMore = function() {
			var totalPages = Math.floor($scope.totalTrucks/$scope.limit);
			return (totalPages > $scope.currentPage && $scope.totalTrucks != (($scope.currentPage + 1) * $scope.limit));
		}

		// Creates the pins on the map
		$scope.refreshMarkers = function() {
			$http({
				method: 'GET',
				url: '/truck?status=APPROVED&limit=' + $scope.limit + '&nelon=' + $scope.nelon + '&nelat=' + $scope.nelat
					+ '&swlon=' + $scope.swlon + '&swlat=' + $scope.swlat + '&pageStart=' + $scope.currentPage
			}).
			success(function (data, status, headers, config) {

				$scope.flashMessage = "";

				$scope.trucks = data.results;
				$scope.totalTrucks = data.count;
				
				clearMapMarkers();
				$scope.markers = [];

				var infowindow = new google.maps.InfoWindow();
				var results = data.results;

				for (var i=0; i < results.length; i++) {
					var position = new google.maps.LatLng(results[i]['loc']['lat'], results[i]['loc']['lon']);			
					var marker = new google.maps.Marker({
						position: position
					});
					marker.setMap($scope.map);
					_.extend(marker, { srcid: results[i].srcid });

					google.maps.event.addListener(marker, 'click', (function(marker, i) {
						return function() {
							infowindow.setContent(getTruckContent(results[i]));
							infowindow.setOptions({ disableAutoPan: true});
							infowindow.open($scope.map, marker);
						};
					})(marker, i));
					$scope.markers.push(marker);
				}
			}).
			error(function (data, status, headers, config) {
				$scope.name = 'Error!';
				$scope.trucks = [];
			});
		};

		$scope.clickMarker = function(srcid) {
			if ($scope.markers) {
				for (var i=0; i < $scope.markers.length; i++) {
					if ($scope.markers[i].srcid == srcid) {
						//click the marker
						google.maps.event.trigger($scope.markers[i], 'click');
						break;
					}
				}
			}
		}

		$scope.nextPage = function() {
			if ($scope.trucks && $scope.trucks.length == $scope.limit) {
				$scope.currentPage++;
				$scope.refreshMarkers();
			}
		}

		$scope.prevPage = function() {
			if ($scope.currentPage > 0) {
				$scope.currentPage--;
				$scope.refreshMarkers();
			}
		}

		$scope.searchByAddress = function() {

			$scope.flashMessage = 'Locating...';
			$http({
				method: 'GET',
				url: '/geocode?address=' + $scope.address
			}).
			success(function (data, status, headers, config) {
				$scope.flashMessage = '';
				$scope.lat = data.lat;
				$scope.lon = data.lon;
				$scope.map.setCenter(new google.maps.LatLng($scope.lat, $scope.lon));
				$scope.map.setZoom(14);
				$scope.mapMoved(true);
			}).
			error(function (data, status, headers, config) {
				$scope.flashMessage = 'Could not find address';
			});
		}

		// Sets the map on all markers in the array.
		function clearMapMarkers() {
			if ($scope.markers) {
				for (var i = 0; i < $scope.markers.length; i++) {
					$scope.markers[i].setMap(null);
				}
			}
		}		

		// Builds the content for the pop-up flags
		function getTruckContent(truck) {
			var content = "";
			content += "<p><b>" + truck.name + "</b></p>";
			content += "<p>" + truck.address + "</p>";
			return content;
		}				
	});