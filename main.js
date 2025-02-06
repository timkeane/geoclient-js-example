import Map from 'ol/Map';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import Source from 'ol/source/Vector';
import Layer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import proj4 from 'proj4';

const url = 'https://api.nyc.gov/geoclient/v2/search';

const form = document.getElementById('search-form');

const view = new View({
  center: [-8235252, 4969073],
  zoom: 9
});

const locationLayer = new Layer();

const locationStyle = new Style({
  image: new Circle({
    fill: new Fill({color: 'black'}),
    radius: 10
  })
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    locationLayer
  ],
  view: view
});

const error = err => {
  console.error(err);
}

const getLocation = geocodeResult => {
  let locationCoordinate;
  let longitude = geocodeResult.longitudeInternalLabel;
  let latitude = geocodeResult.latitudeInternalLabel;
  if (longitude !== undefined && latitude !== undefined) {
    locationCoordinate = [longitude, latitude]
  } else {
    let longitude = geocodeResult.longitude;
    let latitude = geocodeResult.latitude;
    if (longitude !== undefined && latitude !== undefined) {
      locationCoordinate = [geocodeResult.longitude * 1, geocodeResult.latitude * 1];
    }
  }
  if (locationCoordinate === undefined) {
    throw({error: 'location coordinate not found in response', geocodeResult})
  }
  return proj4('EPSG:4326', 'EPSG:3857', locationCoordinate);
}

const mapLocation = geocodeResult => {
  const locationCoordinate = getLocation(geocodeResult);
  const locationFeature = new Feature({
    geometry: new Point(locationCoordinate),
    geocodeResult
  });
  locationFeature.setStyle(locationStyle);
  const locationSource = new Source({
    features: [locationFeature]
  });
  locationLayer.setSource(locationSource);
  view.setCenter(locationCoordinate);
  view.setZoom(17);
}

const displayGeoClientResponse = geoClientResponse => {
  const json = JSON.stringify(geoClientResponse, null, 2);
  document.getElementById('geoclient-response').innerHTML = json;
}

const handleGeoClientResponse = geoClientResponse => {
  const results = geoClientResponse.results;
  if (results.length === 1) {
    mapLocation(results[0].response);
    displayGeoClientResponse(geoClientResponse);
  } else if (results.length > 1) {
    // TODO display possible matches
  } else {
    // TODO display not found message
    console.error({geoClientResponse, results});
  }
}

const submit = event => {
  event.preventDefault();

    fetch(`${url}?input=${form.input.value}`, {
      method: 'GET',
      headers: {
          'Ocp-Apim-Subscription-Key': form.key.value,
          'Cache-Control': 'no-cache'
      }
    }).then(response => {
    response.json().then(handleGeoClientResponse);
  }).catch(error);

}

form.addEventListener('submit', submit);
