const recordsPerCall = 50;

// html elements
const informationElm = document.getElementById('informationContent');
const formAuthor = document.getElementById('authorForm');
const formPublished = document.getElementById('publishedCheck');
const formProceedings = document.getElementById('ignoreProceedingsCheck');
const formFreeText = document.getElementById('exampleText');
const formRun = document.getElementById('runQuery');
const queryInfoElm = document.getElementById('queryInfoContent');

// global state variables
let runningQuery = false;
formRun.innerHTML = "Run";
function toggleRunningStatus(active) {
  // Toogle a marker for a running query
  if (active) {
    formRun.innerHTML = '<div class="spinner-border spinner-border-sm"/>';
    runningQuery = true;
  } else {
    runningQuery = false;
    formRun.innerHTML = 'Run';
  }
}


// enabled substitutions
const substitutions = {
  pages: new RegExp("\\$PAGES", 'g'),
  title: new RegExp("\\$TITLE", 'g'),
  journal: new RegExp("\\$JOURNAL", 'g'),
  authors: new RegExp("\\$AUTHORS", 'g'),
  doi: new RegExp("\\$DOI", 'g'),
  year: new RegExp("\\$PUBYEAR", 'g'),
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
// Will be phased out: http://old.inspirehep.net/info/hep/api
  // The constructor prepares the api call 
  constructor(author, complete=false) {
    // TODO make the order an option
    let baseUrl = `https://inspirehep.net/api/literature?sort=mostrecent&size=${recordsPerCall}&q=find a ${author}`;
    this.apiUrl = baseUrl;
    this.currentPage = 1;
  }

  fetchUrl() {
    const returnUrl = this.apiUrl + `&page=${this.currentPage}`;
    this.currentPage += 1;
    return returnUrl;
  }

  // Parsers
  // They all take as input one of the objects from INSPIRE
  // that are received when making an API call
  parseAuthors(res) {
    // parse the author list
    const authorList = res.metadata.authors;
    let authorString = "";
    for (let author of authorList) {
      authorString += ` ${author.full_name}`;
    }
    return authorString;
  }

  parseDoi(res) {
    const dois = res.metadata.dois;
    if (dois) return dois[0].value;
    return "";
  }

  parseTitle(res) {
    return res.metadata.titles[0].title
  }

  parsePublicationInfo(res) {
    // parse the publication information
    const pubInfoRaw = res.metadata.publication_info;
    if (!pubInfoRaw) return null;
    const pubInfo = pubInfoRaw[0];
    let journal = pubInfo.journal_title;
    if (!journal) { // maybe it is a conference and it is not a journal
      if (pubInfo.titles) {
        journal = pubInfo.titles[0].title
      } else {
        journal = null
      }
    }
    const volume = pubInfo.journal_volume;
    const year = pubInfo.year;
    const pagination = pubInfo.page_start;
    return { journal, volume, year, pagination };
  }

  parsePages(res) {
    return res.metadata.number_of_pages;
  }

  isProceedings(res) {
    // Check whether this is a conference paper
    const paperType = res.metadata.document_type;
    if (paperType) return paperType[0] == 'conference paper';
    return false;
  }
}


// Actual applet
function fetchResults(rApi, listTextItems, qInfo) {
  // recursive function to fetch results
  // upon finalization, if there are still records to retrieve
  // calls itself
  if (!runningQuery) return;

  // Parse the query information
  const publishedOnly = qInfo.publishedOnly;
  const exampleText = qInfo.exampleText;

  let url = rApi.fetchUrl();
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
      res.hits.hits.forEach( result => {
        // Check whether this should be ignored
        if (qInfo.ignoreProceeding && rApi.isProceedings(result)) return;
        // Parse all necessary info
        const pubInfo = rApi.parsePublicationInfo(result);
        if (publishedOnly && !pubInfo) return;
        let infoDict = {};
        infoDict.title = rApi.parseTitle(result);
        infoDict.pages = rApi.parsePages(result);
        infoDict.authors = rApi.parseAuthors(result);
        infoDict.doi = rApi.parseDoi(result);
        if (pubInfo) {
          infoDict.journal = pubInfo.journal;
          infoDict.journalVol = pubInfo.volume;
          infoDict.journalPage = pubInfo.pagination;
          infoDict.year = pubInfo.year;
        }

        // Prepare the output text for this entry
        let resultText = exampleText;
        for (let key in substitutions) {
          resultText = resultText.replace(substitutions[key], infoDict[key]);
        }

        // And now make it into HTML
        listTextItems.push(resultText);
        informationElm.innerHTML = listTextItems.join('<br><br>');

      });
      queryInfoElm.innerHTML = `Found ${listTextItems.length} records total:`;
      // If the full stack of records was consumed, make another API call
      if (res.hits.hits.length == recordsPerCall) {
        return true;
      };
      return false;
    }).then( mustContinue => {
      if (mustContinue) fetchResults(rApi, listTextItems, qInfo);
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
  informationElm.innerHTML = "";
  let textItems = [];

  // everything's ready start fetching result
  fetchResults(apiObject, textItems, qInfo);

}
formRun.addEventListener("click", performAPIcall, true);
