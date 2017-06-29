google.maps.event.addDomListener(window, 'load', function() {
  var canvas = document.getElementById("map1");
  var mapOptions = {
    center: new google.maps.LatLng(40.714352, -74.005973),
    zoom:   7
  };

  var map = new google.maps.Map(canvas, mapOptions);
});
