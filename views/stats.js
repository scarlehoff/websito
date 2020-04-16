// Using leafletjs as the map library
console.log("Including file stats.js");

// Create a map and center it in Seville
const startingZoom = 8;
const startingPos = [37.39, -5.98];
let map = L.map('mapid').setView(startingPos, startingZoom);

// At this point we have a map of the world, a grey world
// now we have to add a layer from openstreetmap or 
// mapbox https://docs.mapbox.com/api/maps/#static-tiles
// or whatever other provider
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/satellite-streets-v11',
    tileSize: 512,
    zoomOffset: -1,
// TODO: remember to rotate this token or to set some domain limit or whatever when merging (if) to master
    accessToken: 'pk.eyJ1Ijoic2NhcmxlaG9mZiIsImEiOiJjazkzOHNwcDEwMmtmM2ZubnZ1bzAxNHhiIn0.u2dsmdZ6Mqd76N3U6T86WQ'
}).addTo(map);

// Example from openstreetmap
//L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//}).addTo(map);

// Add a marker at Malaga
const malagaPos = [36.7, -4.4];
L.marker(malagaPos).addTo(map)
  .bindPopup('Boquerones!');
// if you click you see the text, but you can also do .openPopup() to make it open from the begining

// alternatively, we can also treat popups markers and so as layers
let popupL = L.popup();
popupL.setLatLng(
  malagaPos.map( x =>  x+0.15 )
);
popupL.setContent("Hello").openOn(map); // openOn closes other popups

// We can also do things when the user does things
function onMapClick(e) {
  console.log("Clickedd map at " + e.latlng);
}
map.on('click', onMapClick); // register the function
