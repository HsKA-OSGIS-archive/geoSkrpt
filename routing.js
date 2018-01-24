/**Author Nnoli Chinazom Eunice*/
var profilesList = [];
var leafletid = 0;
/**
 * on click get the coordinates of the clicking add to the list of array 'listofNode'
 */
function clicking(latlng) {
  // Once the map have been clicked
  // Check if the clicked point falls insidde the nogo circles drawn
  var isInside = false;
  nogoAreas.eachLayer(function(layer) {
    // Get the center of each circle in the nogo areas list
    var center = [layer.getLatLng().lng, layer.getLatLng().lat]; // layer.getLatLng().lng + "," + layer.getLatLng().lat
    // And the radius
    var radius = layer._mRadius;
    // Using meters
    var options = {
      units: 'meters'
    };
    // Construct a circle with turf
    var circle = turf.circle(center, radius, options);
    // Check is point is in the circle using turf inside function
    isInside = turf.inside([latlng.lng, latlng.lat], circle);

    // Stop looping when the point is inside the circle
    if (isInside) {
      return layer;
    }
  });

  // If point is not insidde
  // Add it to the map and the list and do the normal procedure
  if (!isInside) {

    //
    // Add to the point ist
    listofNode.push(latlng);
    // Create a marker
    var marker = L.marker(latlng);
    markerList.addLayer(marker);
    marker["index"] = listofNode.length - 1;
    marker.dragging.disable();
    marker.on('dragend', e => reroute(e));
    // Get the profile selected
    var profile = $('#myselect option:selected').val();
    // If the number of points is greater than 1
    //  Find route by taking thelast two items in the list and passing the profile selected
    if (listofNode.length >= 2) {
      var l = listofNode.length;
      var from = listofNode[l - 2];
      var to = listofNode[l - 1];
      var markers = [l - 2, l - 1];
      var alternative = getAlternativeIndex();
      marker["profile"] = profile;
      marker["alternative"] = alternative;

      //getBroute(from.lng, from.lat, to.lng, to.lat, profile, alternative, markers);
      queue.enqueue(getBroute(from.lng, from.lat, to.lng, to.lat, profile, alternative, markers));
    }
  }
}

/**
 *
 */
function getBroute(fromLon, fromLat, toLon, toLat, profile, alternative, markers) {

  var path;
  //http://h2096617.stratoserver.net:443/brouter?lonlats=
  var urll = "http://h2096617.stratoserver.net:443/brouter?lonlats=" + fromLon + "," + fromLat + "|" + toLon + "," + toLat + "&nogos=" + nogoString + "&profile=" + profile + "&alternativeidx=" + alternative + "&format=geojson";
  //var urll = "http://localhost:17777/brouter?lonlats="+fromLon+","+fromLat+"|"+toLon+","+toLat+"&nogos="+nogoString+"&profile="+profile+"&alternativeidx="+alternative+"&format=geojson";
  // calls an AJAX query to the file ajax_dbquery
  $.ajax({
    url: urll,
    dataType: 'json',
    success: function(result) {
      //passes result to handleAjax function
      path = handleAjax(result, profile, markers, alternative);
    },
    error: function(result) {
      handleAjaxR(result)
    }
  });

  return path;
}

/**
 *
 */
function getAlternativeIndex() {
  var item = $('#alternativeidx option:selected').val();
  if (item === "Original") {
    return 0;
  } else if (item === "First alternative") {
    return 1;
  } else if (item === "Second alternative") {
    return 2;
  } else
    return 3;
}

/**
 *
 */
function handleAjax(result, profile, markers, alternative) {
  var layer = L.geoJson(result);
  var polyline;

  layer.eachLayer(function(layerd) {

    var color = 'blue';

    if (profile === 'trekking') {
      color = 'black';
    } else if (profile === 'fastbike') {
      color = 'red';
    } else if (profile === 'car-fast') {
      color = 'green';
    } else if (profile === 'shortest') {
      color = 'pink';
    } else if (profile === 'moped') {
      color = 'purple';
    } else if (profile === 'fastbike-lowtraffic') {
      color = 'orange';
    } else if (profile === 'fastbike-asia-pacific') {
      color = 'blue';
    }
    polyline = L.polyline(layerd._latlngs, {
      color: color,
      weight: 8,
      dashArray: '15,10',
      lineJoin: 'round'
    }).addTo(routeList);


    routeList.addLayer(polyline);
    leafletid = polyline._leaflet_id;
    polyline["profile"] = profile;
    polyline["originalcolor"] = color;
    polyline["selected"] = false;
    polyline["markers"] = markers;
    polyline["alternative"] = alternative;

    polyline.on('click', e => changeRoute(e, polyline));
    profilesList.push(profile);
  });

  return polyline;
}

function changeSelectedRoute() {
  // Get selected profile
  var profile = $('#myselect option:selected').val();
  // Get selected alternative
  var alternative = getAlternativeIndex();
  // Get selected route
  var selectedRoute;
  routeList.eachLayer(function(layer) {
    if (layer.selected) {
      selectedRoute = layer;
      selectedRoute.profile = profile;
    }
  });
  if (selectedRoute != undefined) {
    // Get the associated markers
    var markers = selectedRoute.markers;
    var from = listofNode[markers[0]];
    var to = listofNode[markers[1]];
    // Clear the selected route, and delete from the route list
    routeList.removeLayer(selectedRoute);
    // Rereoute
    // enqueue an item
    queue.enqueue(getBroute(from.lng, from.lat, to.lng, to.lat, profile, alternative, markers));
    /**
    var newLyer = routeList.getLayer(leafletid);

    routeList.eachLayer(function (layer) {
      if((selectedRoute === layer)){
        ///routeList.removeLayer(layer);
        //routeList.addLayer(newLyer);
        console.log(layer);

        layer._latlngs = newLyer._latlngs;
        layer.setStyle({color:newLyer.options.color});

        layer["profile"] = newLyer.profile;
        layer["originalcolor"] = newLyer.options.color;
        layer["alternative"] = newLyer.alternative;
      };
    });

    routeList.removeLayer(leafletid);
    */
  }
}

function toggleLegend() {
  $('#legend').toggle();
}

function changeRoute(e, polyline) {
  // Stop map click listener
  L.DomEvent.stop(e);
  polyline.setStyle({
    color: 'yellow'
  });
  var alt;
  if (polyline.alternative === 0) {
    alt = "Original";
  } else if (polyline.alternative === 1) {
    alt = "First alternative";
  } else if (polyline.alternative === 2) {
    alt = "Second alternative";
  } else if (polyline.alternative === 3) {
    alt = "Third alternative";
  }
  $('button[data-id="myselect"]').find("span.filter-option.pull-left").text(polyline.profile);
  $('button[data-id="alternativeidx"]').find("span.filter-option.pull-left").text(alt);
  polyline.selected = true;
  routeList.eachLayer(function(layer) {
    if (!(polyline === layer)) {
      layer.selected = false;
      layer.setStyle({
        color: layer.originalcolor,
      });
    };
  });
}

/**
 *
 */
function handleMapClick(e) {

  // Clear selected routes
  routeList.eachLayer(function(layer) {

    // Create a small buffer on each layer
    var buffered = turf.buffer(layer.toGeoJSON(), 1, {
      units: 'meters'
    });

    // Check if the e point is inside the buffer
    var point = turf.point([e.latlng.lng, e.latlng.lat]);

    var inside = turf.inside(point, buffered)
    if (!inside) {
      layer.selected = false;
      layer.setStyle({
        color: layer.originalcolor,
      });
    }
  });
}

function handleAjaxR(result) {
  console.log('Error 2');
  console.log(result);

}

function reroute(e) {
  console.log('rerouting!');
  // Repalce the draged marker new postion in the list of nodes
  listofNode[e.target.index] = e.target._latlng;

  var profiles = [];
  var alternatives = [];
  routeList.eachLayer(function(layer) {
    profiles.push(layer.profile);
    alternatives.push(layer.alternative);
  });

  routeList.clearLayers();

  var markers = [];
  markerList.eachLayer(function(marker) {
    markers.push(marker);
  });

  for (var i = 0; i < listofNode.length - 1; i++) {

    var from = listofNode[i];
    var to = listofNode[i + 1];
    var profile = profiles[i];
    var alternative = alternatives[i];
    var markers = [i, i + 1];

    queue.enqueue(getBroute(from.lng, from.lat, to.lng, to.lat, profile, alternative, markers));

  }
  ///queue.enqueue(getBroute(from.lng, from.lat, to.lng, to.lat, profile, alternative, markers));
}
