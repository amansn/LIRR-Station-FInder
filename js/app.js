//Display map
var map;
function initMap() {

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7891, lng: -73.1350},
    zoom: 10
  });


  //Get search from search box
  var currentLat;
  var currentLong;
  var markers = [];
  var infoWindow;
  var newWindow;

  //Knockout View Model
  var ViewModel = {
    self: this,
    test: ko.observable(''),
    resultsTrue: ko.observable(true),
    locations: ko.observableArray([]),
    locationsTwo: ko.observableArray([]),
    query: ko.observable(),
    moveToMarker: function(loc) {
      console.log('loc', loc);
      var center = new google.maps.LatLng(loc.location.lat, loc.location.lng);
      map.panTo(center);
      map.setZoom(14);
      if (newWindow == null) {
        newWindow = new google.maps.InfoWindow();
        console.log('null');
      } else {
        newWindow.marker = null;
        console.log('not');
      }
      populateInfoWindow(markers[loc.id], newWindow);
      bounce(markers[loc.id]);
    }
  }

  ViewModel.filteredLocations = ko.computed(function() {
    if (!ViewModel.query()) {
      markers.forEach(function(marker) {
        marker.setVisible(true);
      });
      if (ViewModel.locations.typeOf === "object") {
        return ViewModel.locations;
      } else if (ViewModel.locations.typeof == "function") {
        return ViewModel.locations();
      } else {
        return ViewModel.locationsTwo();
      }
    } else {
      //Filter help from http://stackoverflow.com/questions/19942641/knockout-js-array-filter-syntax
      var filter = ViewModel.query().toLowerCase();
      return ko.utils.arrayFilter(ViewModel.locations, function(item) {
        if (item.title.toLowerCase().indexOf(filter) > -1) {
          markers[item.id].setVisible(true);
          return true;
        } else {
          markers[item.id].setVisible(false);
          return false;
        }
      })
    }
  });

  //Run all functionality
  var runAll = function() {
    infoWindow = new google.maps.InfoWindow();
    clearMap();
    getStations();
    console.log('infowindow', infoWindow);
  }

  //Get LIRR Station Info
  var getStations = function() {
    $.ajax({
      type: 'GET',
      url: 'https://crossorigin.me/http://amannagpal.com/lirr/api/StationsAll.json'
    }).done(function(response) {
      console.log('response', response);
      buildMarkers(response.Stations);
    }).fail(function(response) {
      window.alert('Unable to grab LIRR stations!');
    })
  }

  //Build markers function
  var buildMarkers = function(data) {

    var locations = [];
    console.log(markers);
    var count = 0;
    //Build locations array
    for (station in data) {
      var newStation = {};
      newStation.title = data[station].NAME;
      newStation.location = {};
      newStation.location.lat = parseFloat(data[station].LATITUDE);
      newStation.location.lng = parseFloat(data[station].LONGITUDE);
      newStation.address = data[station].LOCATION;
      newStation.id = count;
      locations.push(newStation);
      ViewModel.locations.push(newStation);
      ViewModel.locationsTwo.push(newStation);
      count++;
    }
    count = 0;
    //Build markers
    for (var i = 0; i < locations.length; i++) {
      var position = locations[i].location;
      var title = locations[i].title;
      var address = locations[i].address;
      var marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        address: address,
        animation: google.maps.Animation.DROP,
        id: i
      })
      markers.push(marker);
      marker.addListener('click', function() {
        populateInfoWindow(this, infoWindow);
        console.log(markers[this.id]);
        bounce(this);
      })
    }
    ViewModel.locations = locations;
    console.log('markers', markers);
    console.log('locations', ViewModel.locations);
  }


  //https://developers.google.com/maps/documentation/javascript/examples/marker-animations
  var bounce = function(marker) {
    //Clear bounce on all other markers
    for (var i = 0; i < markers.length; i++) {
      markers[i].setAnimation(null);
    }
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }

  var noBounce = function(marker) {
    marker.setAnimation(null);
  }

  //Populate Info Window
  var populateInfoWindow = function(marker, infoWindowSelection) {
    if (infoWindowSelection.marker != marker) {
      infoWindowSelection.marker = marker;
      infoWindowSelection.setContent('<div class="bold">' + marker.title + '</div>' + '<div>' + marker.address + '</div>');
      infoWindowSelection.open(map, marker);
      infoWindowSelection.addListener('closeclick', function() {
        infoWindowSelection.marker = null;
        marker.setAnimation(null);
      })
    }
  }

  //Removes marker from map
  var clearMap = function() {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    markers = [];
  }

  //Geocoding function - didn't end up needing this
  var geocodeFxn = function() {

    var geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: '',
      componentRestrictions: {administrativeArea: 'New York'}
    }, function(results,status) {
      if (status == google.maps.GeocoderStatus.OK) {
        currentLat = results[0].geometry.location.lat();
        currentLong = results[0].geometry.location.lng();
        console.log(currentLat);
        console.log(currentLong);
      } else {
        window.alert("Couldn't geocode the address!");
      }
    }
    )
  }

  ko.applyBindings(ViewModel);
  runAll();

}

var googleError = function() {
  window.alert('Unable to load Google Maps API!');
}
