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

// Global variables
let f = undefined;
let savedPositions = {};
let visitedIPs = {};

// get the page elements
let dbFileElm = document.getElementById('dbfile');
let dbLabel = document.getElementById('dbname');
let executeBtn = document.getElementById("runQuery");
let clearBtn = document.getElementById("clearMarkers");
let informationElm = document.getElementById('informationContent');
let selectorWebElm = document.getElementById('selectorWeb');
let datepickerElm = document.getElementById('datetimepickerInfo');
datepickerElm.value = null;

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
let savedPositionsLayerGroup = L.layerGroup([]).addTo(map);

// Example from openstreetmap
//L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//}).addTo(map);

// Now prepare some useful functions to be used later
function objectToHtml(visitedPages) {
  // receives an array of objects and creates a table
  let text = `<table class="table">`;
  text += `<thead class="text-center"><tr><th>Date</th><th>Page</th></tr></thead>`;
  text += `<tbody>`
  for (page of visitedPages) {
    text += `<tr>`
    text += `<td> ${page.date} </td><td> ${page.page} </td>`
    text += `</tr>`
  }
  text += '</tbody></table>'
  return text;
}
function generateInfoTable(ipval) {
  const visitedPages = visitedIPs[ipval];
  informationElm.innerHTML = objectToHtml(visitedPages);
}

function compareDate(d1, d2) {
  return d1.getTime() == d2.getTime();
}

function removeDuplicates(arr) {
  let newArr = [];
  outerLoop:
    for (let oldItem of arr) {
      for(let newItem of newArr) {
        if (newItem.page == oldItem.page && compareDate(newItem.date, oldItem.date)) continue outerLoop;
      }
      newArr.push(oldItem);
    }
  return newArr;
}

function generateMarker(info) {
  // generate a marker in the map given an info object
  // with latitude, longitude, ip
  const lat = info.lat;
  const lon = info.lon;
  const newText = `<a href="#" onclick="generateInfoTable('${info.ip}')">${info.ip}</a>`
  if (savedPositions[lat] && savedPositions[lat][lon]) {
    let layer = savedPositions[lat][lon];
    const currentVals = layer.getPopup()._content;
    layer.bindPopup(`${currentVals}<br>${newText}`);
  } else {
    if (!(lat in savedPositions)) savedPositions[lat] = {};
    const layerRef = L.marker([lat, lon]).bindPopup(newText);
    savedPositions[lat][lon] = layerRef;
    savedPositionsLayerGroup.addLayer(layerRef);
  }
}

function parseResponse(arr) {
  const ip = arr[0];
  const coord = arr[1];
  const lat = parseFloat(coord.split(",")[0]);
  const lon = parseFloat(coord.split(",")[1]);
  return { ip, lat, lon };
}


// Do something when the database is loaded
dbFileElm.onchange = function() {
  f = this.files[0];
  const fileName = f.name;
  // add the name to the label
  dbLabel.innerHTML = fileName;
  console.log(f);
  // Now read the database and select all pages included
  let r = new FileReader();
  r.onload = function() {
    const Uints = new Uint8Array(r.result);
    initSqlJs(config).then( (SQL) => {
      const db = new SQL.Database(Uints);
      const results = db.exec('select `web` from info where ip!="192.168.1.1"')[0].values;
      selectorWebElm.innerHTML = `<option selected value="*">Show all</option><option value='/'>/</option>`;
      let check = ["/"];
      for (let entry of results) {
        const web = entry[0];
        if (check.includes(web)) continue;
        check.push(web);
        selectorWebElm.innerHTML += `<option value="${web}">${web}</option>`;
      }
    });
  }
  r.readAsArrayBuffer(f);

}

function clearMarkers() {
  console.log("Clearing all markers");
  savedPositions = {};
  visitedIPs = {};
  savedPositionsLayerGroup.clearLayers();
  informationElm.innerHTML = "";
}
function clearAll() {
  datepickerElm.value = null;
  clearMarkers();
}
clearBtn.addEventListener("click", clearAll, true);

// All information is obtained from the database once the RUN button is pressed
// visited IPs are cached at visitedIPs
function executeAction() {
  console.log("Executing RUN");
  // Clean current info
  clearMarkers();

  // Read the filters
  const selectedPage = selectorWebElm.selectedOptions[0].value;
  const selectedDateRaw = datepickerElm.value;
  console.log(selectedDateRaw);
  let selectedDate = null;
  if (selectedDateRaw) {
    selectedDate = new Date(selectedDateRaw).getDate();
  }

  // Now let's read up the file
  let r = new FileReader();
  r.onload = function() {
    const Uints = new Uint8Array(r.result);
    initSqlJs(config).then( (SQL) => {
      // open the database
      console.log("opening the db");
      const db = new SQL.Database(Uints);
      // get all pairs IP and location
      let results = db.exec('select `ip`, `geo` from iptab where ip!="192.168.1.1"');
      // Prepare a query to read up the data for a given IP
      let queryData = 'select `date`, `web` from info where ip=$ip';
      if (selectedPage != '*') {
        queryData += ` and web="${selectedPage}"`;
      }
      let getData = db.prepare(queryData);
      // And use them to add markers to the map
      for (let value of results[0].values) {
        // In their most naive formt he results are just
        // an array with two values ["ip", "coordinates"]
        const information = parseResponse(value);
        if (information.ip in visitedIPs) continue;
        // Now pass the information to generate the marker with
        getData.bind({$ip:information.ip});
        // and loop over it to get all values we are interested
        let visitedPages = [];
        while(getData.step()) {
          const row = getData.getAsObject();
          const parsedDate = new Date(row.date);
          // Check whether this is the selected date
          if(selectedDate && parsedDate.getDate() != selectedDate) continue;
          visitedPages.push({page:row.web, date:parsedDate});
        }
        // if this IP dont have any values for the returned values
        // just skip
        if (!visitedPages.length) continue;
        // Remove duplicates
        visitedPages = removeDuplicates(visitedPages);
        // Order the dates
        visitedPages.sort( (a,b) => {
          return (a.date > b.date) ? 1 : -1
        });
        
        generateMarker(information);
        visitedIPs[information.ip] = visitedPages;
      }
    })
  }
  r.readAsArrayBuffer(f);
}
executeBtn.addEventListener("click", executeAction, true);

