// Using leafletjs as the map library
console.log("Including file stats.js");

// Prepare the parameters
config = {
  locateFile: (filename, prefix) => {
    // This is necessary to find the wasm file
    // for sql.js to run
    return `./sql.js/dist/${filename}`;
  }
}

// get the page elements
let dbFileElm = document.getElementById('dbfile');
let dbLabel = document.getElementById('dbname');
let executeBtn = document.getElementById("runQuery");

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

// Now prepare some useful functions to be used later
function generate_marker(info) {
  L.marker([info.lat, info.lon]).addTo(map).bindPopup(info.ip);
}
function parse_response(arr) {
  const ip = arr[0];
  const coord = arr[1];
  const lat = parseFloat(coord.split(",")[0]);
  const lon = parseFloat(coord.split(",")[1]);
  return { ip, lat, lon };
}

// Do something when the database is loaded
dbFileElm.onchange = function() {
  const f = this.files[0];
  const fileName = f.name;
  // add the name to the label
  dbLabel.innerHTML = fileName;
  console.log(f);
  // Now let's read up the file
  let r = new FileReader();
  r.onload = function() {
    const Uints = new Uint8Array(r.result);
    initSqlJs(config).then( (SQL) => {
      // open the database
      const db = new SQL.Database(Uints);
      // get all pairs IP and location
      let results = db.exec('select `ip`, `geo` from iptab where ip!="192.168.1.1"');
      // And use them to add markers to the map
      for (let value of results[0].values) {
        // In their most naive formt he results are just
        // an array with two values ["ip", "coordinates"]
        const information = parse_response(value);
        // Now pass the information to generate the marker with
        generate_marker(information);
      }
      console.log(results);
      debugger;
    })
  }
  r.readAsArrayBuffer(f);
}

// Do something when the apply button is pressed
function executeQuery() {
  initSqlJs(config).then( (SQL) => {
    let db = n
  });
}
executeBtn.addEventListener("click", executeQuery, true);


initSqlJs(config).then( (SQL) => {
  let db = new SQL.Database();
  console.log("db created");
  // Run some query without even returning the results
  
});

// Add a marker at Malaga
// const malagaPos = [36.7, -4.4];
// L.marker(malagaPos).addTo(map)
//   .bindPopup('Boquerones!');
// // if you click you see the text, but you can also do .openPopup() to make it open from the begining

// // alternatively, we can also treat popups markers and so as layers
// let popupL = L.popup();
// popupL.setLatLng(
//   malagaPos.map( x =>  x+0.15 )
// );
// popupL.setContent("Hello").openOn(map); // openOn closes other popups

// // We can also do things when the user does things
// function onMapClick(e) {
//   console.log("Clickedd map at " + e.latlng);
// }
// map.on('click', onMapClick); // register the function
