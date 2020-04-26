const recordsPerCall = 50;
// Will be phased out: http://old.inspirehep.net/info/hep/api

// html elements
const informationElm = document.getElementById('informationContent');
const formAuthor = document.getElementById('authorForm');
const formPublished = document.getElementById('publishedCheck');
const formProceedings = document.getElementById('ignoreProceedingsCheck');
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
  pages: new RegExp("\\$PAGES", 'g'),
  title: new RegExp("\\$TITLE", 'g'),
  journal: new RegExp("\\$JOURNAL", 'g'),
  journalPage: new RegExp("\\$PAGEJOURNAL", 'g'),
  journalVol: new RegExp("\\$VOLJOURNAL", 'g')
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
class InspireHEP {
  // The constructor prepares the api call 
  constructor(author, complete=false) {
    let baseurl = `http://old.inspirehep.net/search?of=recjson&rg=${recordsPerCall}&`;
    if (!complete) baseurl += "&ot=authors,title,physical_description,publication_info,collection&";

// Using old inspire API
    this.apiUrl = baseurl + "p=find+a+" + author.replace(" ", "+");
  }

  fetchUrl(currentRecord) {
    return this.apiUrl + `&jrec=${currentRecord}`;
  }

  // Parsers
  // They all take as input one of the objects from INSPIRE
  // that are received when making an API call
  parseAuthors(res) {
    // parse the author list
    const authorList = res.authors;
    let authorString = "";
    for (let author of authorList) {
      authorString += ` ${author.full_name}`;
    }
    return authorString;
  }

  parseAuthors(res) {
    // parse the author list
    const authorList = res.authors;
    let authorString = "";
    for (let author of authorList) {
      authorString += ` ${author.full_name}`;
    }
    return authorString;
  }

  parseTitle(res) {
    // parse the title
    return res.title.title;
  }

  parsePublicationInfo(res) {
    // parse the publication information
    const pubInfo = res.publication_info;
    if (!pubInfo) return null;
    const journal = pubInfo.title;
    if (!journal) return null;
    const volume = pubInfo.volume;
    const year = pubInfo.year;
    const pagination = pubInfo.pagination;
    return { journal, volume, year, pagination };
  }

  parsePages(res) {
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

  isProceedings(res) {
    // Check whether this is a conference paper
    const paperType = res.collection[3];
    if (paperType) return paperType.primary == 'ConferencePaper';
    return false;
  }
}


// Actual applet
function fetchResults(rApi, currentRecord, listTextItems, qInfo) {
  // recursive function to fetch results
  // upon finalization, if there are still records to retrieve
  // calls itself
  if (!runningQuery) return;

  // If you have more than 5000 papers you really don't needs this fuck it
  if (currentRecord > 5000) return;

  // Parse the query information
  const publishedOnly = qInfo.publishedOnly;
  const exampleText = qInfo.exampleText;

  let url = rApi.fetchUrl(currentRecord);
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
        // Check whether this should be ignored
        if (qInfo.ignoreProceeding && rApi.isProceedings(result)) return;
        // Parse all necessary info
        const pubInfo = rApi.parsePublicationInfo(result);
        if (publishedOnly && !pubInfo) return;
        let infoDict = {};
        infoDict.title = rApi.parseTitle(result);
        infoDict.pages = rApi.parsePages(result);
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
      return false;
    }).then( mustContinue => {
      if (mustContinue) fetchResults(remoteApi, currentRecord + recordsPerCall, listTextItems, qInfo);
      toggleRunningStatus(mustContinue);
    });
}

function performAPIcall() {
  // Function called when clicking the RUN button
  // Take original text
  const exampleText = parseTextField(formFreeText);
  // Do we want published only?
  const publishedOnly = formPublished.checked;
  // Do we want to ignore proceedings?
  const ignoreProceeding = formProceedings.checked;
  // Who are we looking for
  const authorSelected = parseTextField(formAuthor);
  // Generate API call
  const apiObject = new InspireHEP(authorSelected, true);

  // Create a query info object to fitler the data (very simple for now)
  const qInfo = {
    publishedOnly,
    ignoreProceeding,
    exampleText
  }

  // initializate the state
  toggleRunningStatus(true);
  queryInfoElm.innerHTML = "";
  let textItems = [];

  // everything's ready start fetching result
  fetchResults(apiObject, 0, textItems, qInfo);

}
formRun.addEventListener("click", performAPIcall, true);