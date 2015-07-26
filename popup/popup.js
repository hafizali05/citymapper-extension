angular.module('citymapper', [])

.controller('ExtensionCtrl', ['$scope', '$timeout', '$q', function($scope, $timeout, $q) {

  var map;
  var geocoder = new google.maps.Geocoder();

  var startMarker;
  var endMarker;
  var line;

  var startIcon = {
    url: '../img/flag-start.png',
    scaledSize: new google.maps.Size(71, 45),
    origin: new google.maps.Point(0,0),
    anchor: new google.maps.Point(29, 44)
  };

  var endIcon = {
    url: '../img/flag-end.png',
    scaledSize: new google.maps.Size(71, 45),
    origin: new google.maps.Point(0,0),
    anchor: new google.maps.Point(29, 44)
  };

  $scope.start = {
    text: ""
  };

  $scope.end = {
    text: ""
  };

  $scope.reverse = function() {
    var oldStart = $scope.start;
    $scope.start = $scope.end;
    $scope.end = oldStart;
    $scope.startChanged();
    $scope.endChanged();
  };

  $scope.launch = function() {
    chrome.tabs.create({'url': "http://citymapper.com"});
  };

  $scope.go = function() {
    var url = "http://citymapper.com/london?"
    if ($scope.start.geo) {
      url += "start=" + $scope.start.geo.geometry.location.A + "," +
             $scope.start.geo.geometry.location.F + "&saddr=" + $scope.start.text;

      if ($scope.end.geo) {
        url += "&";
      }
    }

    if ($scope.end.geo) {
      url += "end=" + $scope.end.geo.geometry.location.A + "," +
             $scope.end.geo.geometry.location.F + "&eaddr=" + $scope.end.text;
    }

    chrome.tabs.create({'url': url});
  }

  $scope.startChanged = function() {
    getLocation($scope.start.text)
    .then(function(result) {
      $scope.start.geo = result;
      if (!startMarker) {
        startMarker = new google.maps.Marker({
          position: result.geometry.location,
          map: map,
          icon: startIcon 
        });
      }
      else {
        startMarker.setPosition(result.geometry.location);
      }
      refreshMap();
    });
  };

  $scope.endChanged = function() {
    getLocation($scope.end.text)
    .then(function(result) {
      $scope.end.geo = result;
      if (!endMarker) {
        endMarker = new google.maps.Marker({
          position: result.geometry.location,
          map: map,
          icon: endIcon
        });
      }
      else {
        endMarker.setPosition(result.geometry.location);
      }
      refreshMap();
    });
  };

  function getLocation(address) {
    return $q(function(resolve, reject) {
      geocoder.geocode({'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          resolve(results[0]);
        } 
        else {
          console.log("Failed to geocode: " + status);
          reject();
        }
      });
    });
  }

  function refreshMap() {
    if (startMarker && endMarker) {
      var bounds = new google.maps.LatLngBounds();
      bounds.extend(startMarker.getPosition());
      bounds.extend(endMarker.getPosition());
      map.fitBounds(bounds);

      clearLine();
      line = new google.maps.Polyline({
        path: [
            startMarker.getPosition(), 
            endMarker.getPosition()
        ],
        strokeColor: "#999999",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
      });
    }
    else if (startMarker) {
      map.panTo($scope.start.geo.geometry.location);
      clearLine();
    }
    else if (endMarker) {
      map.panTo($scope.end.geo.geometry.location);
      clearLine();
    }
    else {
      map.panTo({
        lat: 51.508593,
        lng: -0.124755
      });
      clearLine();
    }
  }

  function clearLine() {
    if (line) {
      line.setMap(null);
    }
  }

  function initialize() {  
    var mapOptions = {
      zoom: 13,
      streetViewControl: false
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    refreshMap();
  }

  google.maps.event.addDomListener(window, 'load', function () {
    initialize();
  });
}]);
