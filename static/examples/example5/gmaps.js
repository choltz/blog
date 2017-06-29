google.maps.event.addDomListener(window, 'load', function() {

  var canvas     = document.getElementById("map-canvas");
  var mapOptions = {
    center: new google.maps.LatLng(40.714352, -74.005973),
    zoom:   7
  };

  var map = new google.maps.Map(canvas, mapOptions);

  // Add a marker at the position where the mouse is clicked
  google.maps.event.addListener(map, 'click', function(event) {
    new google.maps.Marker( { position: event.latLng,
                              map:      map } );
  });

});
