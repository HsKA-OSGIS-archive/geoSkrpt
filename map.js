/**Author Nnoli Chinazom Eunice*/
var map;
var listofNode = [];
var nogoAreas = new L.FeatureGroup();
var markerList = new L.FeatureGroup();
var routeList = new L.FeatureGroup();
var drawControl;
var locator;
var nogoString = "";
// create a new queue
var queue = new Queue();

function initMap() {
  map = L.map('map').setView([49.0069, 8.4037], 13);
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  //map.on('click', e=> clicking (e.latlng) );
  map.addLayer(nogoAreas);
  map.addLayer(markerList);
  map.addLayer(routeList);
  drawControl = new L.Control.Draw({
    draw: {
      position: 'topright',
      polyline: false,
      polygon: false,
      circle: true,
      rectangle: false,
      marker: {
        repeatMode: true
      }
    },
    edit: {
      featureGroup: nogoAreas
    }
  });
  // find user's location
  /**
     *
      locator = L.control.locate({
         position: 'topright',
         strings: {
         title: "Show me where I am"
         }
       }).addTo(map);*/
  map.addControl(drawControl);
  map.on(L.Draw.Event.CREATED, e => onDrawCreated(e));
  map.on('click', e => handleMapClick(e));
}

function onDrawCreated(e) {
  console.log(e);
  if (e.layerType === "circle") {
    nogoAreas.addLayer(e.layer);
    nogoString = "";
    nogoAreas.eachLayer(function(layer) {
      console.log(layer);
      nogoString += layer.getLatLng().lng + "," + layer.getLatLng().lat + "," + parseInt(layer._mRadius) + "|";
    });
    // Remove the last item "|"
    nogoString = nogoString.slice(0, -1);
  } else if (e.layerType === "marker") {
    clicking(e.layer._latlng);
  }
}
