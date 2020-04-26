const recordsPerCall = 50;
const baseurl = `http://old.inspirehep.net/search?of=recjson&ot=authors,title,physical_description,publication_info&rg=${recordsPerCall}&`;
// Using old inspire API
// Will be phased out: http://old.inspirehep.net/info/hep/api

// html elements
const informationElm = document.getElementById('informationContent');
const formAuthor = document.getElementById('authorForm');
const formPublished = document.getElementById('publishedCheck');
const formFreeText = document.getElementById('exampleText');
const formRun = document.getElementById('runQuery');
const statusElm = document.getElementById('statusContent');
const queryInfoElm = document.getElementById('queryInfoContent');

// global state variables
let runningQuery = false;
function toggleRunningStatus(active) {
  // Toogle a marker for a running query
  if (active) {
    statusElm.innerHTML = "Running query, please wait...";
    runningQuery = true;
  } else {
    runningQuery = false;
    statusElm.innerHTML = "";
  }
}


// enabled substitutions
const substitutions = {
  pages: "$PAGES",
  title: "$TITLE",
  journal: "$JOURNAL",
  journalPage: "$JOURNALPAGE",
  journalVol: "$JOURNALVOL"
};

// Small utility one-liners functions
function evalMath(math) { return Function(`'use strict'; return (${math})`)() }
function parseTextField(textField){
  if (textField.value) return textField.value;
  return textField.placeholder;
}

//
// INSPIRE API 
//

// Generate API call
function genApiCall(author) {
  const url = baseurl + "p=find+a+" + author.replace(" ", "+");
  return url;
}

// Parse API responses
// They all take as input one of the objects from INSPIRE
// that are received when making an API call
function parseAuthors(res) {
  // parse the author list
  const authorList = res.authors;
  let authorString = "";
  for (let author of authorList) {
    authorString += ` ${author.full_name}`;
  }
  return authorString;
}

function parseTitle(res) {
  // parse the title
  return res.title.title;
}

function parsePublicationInfo(res) {
  // parse the publication information
  pubInfo = res.publication_info;
  if (!pubInfo) return null;
  const journal = pubInfo.title;
  if (!journal) return null;
  const volume = pubInfo.volume;
  const year = pubInfo.year;
  const pagination = pubInfo.pagination;
  return { journal, volume, year, pagination };
}

function parsePages(res) {
  // parse the number of pages
  if (res.physical_description) return res.physical_description.pagination;
  // The result does not contain a physical description
  // try to get the number of pages from the publication info
  if (res.publication_info) {
    return Math.abs(evalMath(res.publication_info.pagination));
  }
  console.log("Could not obtain pagination information for: ")
  console.log(res);
  return "NotFound";
}


// Actual applet
function fetchResults(rawUrl, currentRecord, listTextItems, qInfo) {
  // recursive function to fetch results
  // upon finalization, if there are still records to retrieve
  // calls itself
  if (!runningQuery) return;

  // If you have more than 5000 papers you really don't needs this fuck it
  if (currentRecord > 5000) return;

  // Parse the query information
  const publishedOnly = qInfo.publishedOnly;
  const exampleText = qInfo.exampleText;

  let url = rawUrl + `&jrec=${currentRecord}`;
  console.log("Api call: ");
  console.log(url);

  fetch(url).then( data => {
    // Get the information
    console.log(data);
    return data.json();
    }).then( res => {
      // Get the json
      console.log(res);
      if (res.length < 1) {
        toggleRunningStatus(false);
      }
      // Now run over all entries and parse the information
      res.forEach( result => {
        // Parse all necessary info
        const pubInfo = parsePublicationInfo(result);
        if (publishedOnly && !pubInfo) return;
        let infoDict = {};
        infoDict.title = parseTitle(result);
        infoDict.pages = parsePages(result);
        if (pubInfo) {
          infoDict.journal = pubInfo.journal;
          infoDict.journalVol = pubInfo.volume;
          infoDict.journalPage = pubInfo.pagination;
        }

        // Prepare the output text for this entry
        let resultText = exampleText;
        for (let key in substitutions) {
          resultText = resultText.replace(substitutions[key], infoDict[key]);
        }

        // And now make it into HTML
        listTextItems.push(resultText);
        informationElm.innerHTML = listTextItems.join('<br><br>');// objectToHtml(visitedPages);

      });
      queryInfoElm.innerHTML = `Found ${listTextItems.length} records total:`;
      // If the full stack of records was consumed, make another API call
      if (res.length == recordsPerCall) {
        return true;
      };
      console.log("We are finished here");
      console.log(res.length);
      console.log(recordsPerCall);
      return false;
    }).then( mustContinue => {
      console.log("TEST");
      if (mustContinue) fetchResults(rawUrl, currentRecord + recordsPerCall, listTextItems, qInfo);
      toggleRunningStatus(mustContinue);
    });
}

function performAPIcall() {
  // Function called when clicking the RUN button
  // Take original text
  const exampleText = parseTextField(formFreeText);
  // Do we want published only?
  const publishedOnly = formPublished.checked;
  // Who are we looking for
  const authorSelected = parseTextField(formAuthor);
  // Generate API call
  const rawUrl = genApiCall(authorSelected);

  // Create a query info object to fitler the data (very simple for now)
  const qInfo = {
    publishedOnly,
    exampleText
  }

  // initializate the state
  toggleRunningStatus(true);
  queryInfoElm.innerHTML = "";
  let textItems = [];

  // everything's ready start fetching result
  fetchResults(rawUrl, 0, textItems, qInfo);

}
formRun.addEventListener("click", performAPIcall, true);
