// const url = "http://old.inspirehep.net/record/451647?of=recjson&ot=recid,number_of_citations,authors,title";
const url = "http://old.inspirehep.net/search?p=find+a+cruz-martinez";

// Will be phased out: http://old.inspirehep.net/info/hep/api

// html elements
const informationElm = document.getElementById('informationContent');

// Parsers
function parseAuthors(authorList) {
  let authorString = "";
  for (let author of authorList) {
    authorString += ` ${author.full_name}`;
  }
  return authorString;
}

fetch(url).then( data => {
  console.log("test");
  return data.json();
  }).then( res => {
    console.log(res);
    let text = "";
    for (let result of res) {
      text += `Authors: ${parseAuthors(result.authors)}`
    }
    informationElm.innerHTML = text;// objectToHtml(visitedPages);
    });
