+++
title         = "Getting started with the Google Maps API"
date          = "2013-09-17T14:09:00"
comments      = true
thumbnail     = "/images/google_maps.png"
image         = "google_maps.png"
image_creator = "https://www.flickr.com/photos/nez/"
+++
Recently I had the chance to work with a bunch of zip code and area code data. Each code had an associated latitude and longitude - from a list of area codes, I had to find those  that were N miles from a specific zip code.
<!--more-->
Ultimately the solution didn't call for a map-style UI, but I had he opportunity to explore the Google Maps API a bit. Here's a brief overview of the service.

<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCoKTnqa7xdDk3RVlZo3rWOYBPDI-kgXrM&sensor=false"></script>
<script type="text/javascript" src="/js/2013-09-13-getting-started-with-the-google-maps-api.js"></script>

What is it?
===========
<div id="map1" style="width: 300px; height: 200px; margin: 10px; border: solid 1px #999; float: right;"></div>
The Google Maps API is a service with which you can configure interactive maps and embed them in your web page.

As you can see to the right, you can mouse around the map, zoom, and even drop into street view.
<div style="clear: both;"></div>

Get an API key
==============
Before you start using the Google Maps API, you'll need to get an API key. Head over to the <a href="https://code.google.com/apis/console" target="window">Google API console</a> and click on the "Create new Browser key" button. A dialog will open where you can enter restrictions that control which hosts can use the key.

For development purposes, just leave that blank and click "Create" to generate your key. Take note of this key - you'll need it later when you construct your API calls. Look at the <a href="https://developers.google.com/maps/documentation/javascript/tutorial#api_key" target="window">Google Maps API documentation</a> for more information about Google API keys.

One more note on keys: there are restrictions to the frequency of requests you can make to the API - there are also daily limits for some features. Request limit details can be found on the <a href="https://developers.google.com/maps/documentation/business/faq#usage_limits" target="window">Google Business FAQ</a>.

Basic example
=============
The most basic example of a Google Map requires three components:

* HTML markup - you'll need a div tag to house the map
* Javascript - a small bit of code to call the Google Maps API with parameters to configure the map
* Optional - CSS to style your page

{{< highlight html >}}
  <html>
    <head>
      <link rel="stylesheet" type="text/css" href="gmaps.css" />
      <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=user_your_key_here&sensor=false"></script>
      <script type="text/javascript" src="gmaps.js"></script>
    </head>
    <body>
      <div id="map-canvas"/>
    </body>
  </html>
{{< /highlight >}}

The HTML file is pretty standard markup. Line five is the most important - this is required to load the Google Maps API. You'll also need a div block to house the map - use whatever identification scheme you like - you'll use Javascript to get a reference to this element for the API call.

{{< highlight javascript >}}
  google.maps.event.addDomListener(window, 'load', function() {
    var canvas = document.getElementById("map-canvas");
    var mapOptions = {
      center: new google.maps.LatLng(40.714352, -74.005973),
      zoom:   7
    };

    var map = new google.maps.Map(canvas, mapOptions);
  });
{{< /highlight >}}

This is where the magic happens. First we wait until the page is loaded before calling the API:

{{< highlight javascript >}}
  google.maps.event.addDomListener(window, 'load', function() { ...
{{< /highlight >}}

Then we get a reference to the HTML element that will contain the map and set up some minimal map options:

{{< highlight javascript >}}
  var canvas = document.getElementById("map-canvas");
  var mapOptions = {
    center: new google.maps.LatLng(40.714352, -74.005973),
    zoom:   7
  };
{{< /highlight >}}

At the minimum, you need to set a center for the map and a zoom-level. In this example, I'm using explicit latitude and longitude coordinates. The Google Maps API includes a geolocation package - you may find that a more intuitive interface to use here.

Finally, we bring the HTML element and the options together - when the page is done loading, you should have a map!

{{< highlight javascript >}}
  var map = new google.maps.Map(canvas, mapOptions);
{{< /highlight >}}

Here is the complete code for this example:
<a href="https://github.com/choltz/fiddle/tree/master/gmaps-getting-started/example1" target="window">Code for this example</a> is up on github.

CSS Styling
===========
The map container element is subject to the usual CSS styling rules. You can use styles to format the map's borders, dimensions, and placement. You can see a demo of this towards the top of this article or click below to demo in a new page.

<a href="/examples/example2/gmaps.html" target="window">See the demo >></a><br/>
<a href="https://github.com/choltz/fiddle/tree/master/gmaps-getting-started/example2" target="window">View the code >></a>

Map Types
=========
Aside from street view and birds-eye view (which are also available to the API) Google Maps has four view modes: Satellite, Road Map, Hybrid, and Terrain. This can be set during map initialization as an option:

{{< highlight javascript >}}
  var mapOptions = {
    center: new google.maps.LatLng(40.714352, -74.005973),
    zoom:   7,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
{{< /highlight >}}

Or it can be set with a separate Javascript call:

{{< highlight javascript >}}
  map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
{{< /highlight >}}

This is particularly helpful if you want to set the map type based on an event handler. In this example, we change the map type on a click event:

{{< highlight javascript >}}
  $("input[type=radio]").click(function(e) {
    map.setMapTypeId(e.target.value);
  });
{{< /highlight >}}

Note - this example users jQuery to manage the radio button click events.

<a href="/examples/example3/gmaps.html" target="window">See the demo >></a><br/>
<a href="https://github.com/choltz/fiddle/tree/master/gmaps-getting-started/example3" target="window">View the code >></a>

If you want to manage the map controls yourself, you can disable all map widgets:

{{< highlight javascript >}}
  var mapOptions = {
    center: new google.maps.LatLng(40.714352, -74.005973),
    zoom:   7,
    disableDefaultUI: true
  };
{{< /highlight >}}

<a href="/examples/example4/gmaps.html" target="window">See the demo >></a><br/>
<a href="https://github.com/choltz/fiddle/tree/master/gmaps-getting-started/example4" target="window">View the code >></a>

Although the navigation widgets are removed from the map UI, you can still use the mouse to move around the map and zoom in and out.

Markers
=======
With a little bit of Javascript, you can add your own custom markers to a map.

{{< highlight javascript >}}
  google.maps.event.addListener(map, 'click', function(event) {
    new google.maps.Marker( { position: event.latLng,
                              map:      map } );
  });
{{< /highlight >}}

In this example, a marker is added each time you click on the map.

<a href="/examples/example5/gmaps.html" target="window">See the demo >></a><br/>
<a href="https://github.com/choltz/fiddle/tree/master/gmaps-getting-started/example5" target="window">View the code >></a>

This barely scratches the surface
=================================
In this article, we discussed the basics behind the Google Maps API: Getting a key, creating a basic map, setting a few properties, and reacting to events. There is much, much more to explore here. <a href="https://developers.google.com/maps/documentation/javascript/tutorial" target="window">The google maps developer's guide</a> is comprehensive and covers topics such as: events, layers, overlays, and geolocation. If you're interested in learning more, check out their guide - it is very detailed.

That's all for now. If you want to explore this API with me further, let me know and I'll dive in further in a follow-up post.
