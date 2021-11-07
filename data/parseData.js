#!/usr/bin/node

"use strict";
const fs = require('fs');
const path = require('path');

const fileIn = "/home/jumax9/Documents/Burocracia/Curriculum Vitae/publications.bib";
const fileOut = path.join(__dirname, "publications.json");


// +++++ Utilities

/* Receives a string with the contents of a bib file
 * and returns an array of strings where each element is
 * an entry
 */
function getBibEntries(bibStringRaw) {
  const myRegex = /@[^@]*}/g;
  // Remove indentation
  const bibStringDigest = bibStringRaw.replace( /^\s\s+/gm, " ");
  // Remove the linebreaks that are NOT after ","
  const bibString = bibStringDigest.replace( /(?<!,)\n+/gm, "");
  // Return the matches
  const matches = bibString.match(myRegex);
  return matches;
}

/* Parses the text between quotes
 * and remove {}
 */
function parseBetweenQuotes(line) {
  const ret = line.match(/"([^']*?)"/);
  if (ret) {
    let content = ret[0];
    content = content.replace("{", "");
    content = content.replace("}", "");
    return content.replace(/"/g, "");
  } else {
    return false;
  }
}

/* Parses the text between {} 
 */
function parseBetweenCurly(line) {
  const ret = line.match(/{([^']*?)}/);
  if (ret) {
    let content = ret[0];
    content = content.replace("{", "");
    content = content.replace("}", "");
    return content
  } else {
    return false;
  }
}


/* Parses a bib entry
 */
function parseEntry(entry, keys, safety=true) {
  // Split the entry on line breaks
  const splitted = entry.split('\n');
  const articleObject = {};

  for (let i in splitted) {
    const line = splitted[i];

    // Go through the keys and check whether they are included
    for (let j in keys) {
      const key = keys[j];
      if (line.includes(` ${key}`)) {
        let result = parseBetweenQuotes(line);
        if (!result) result = parseBetweenCurly(line);
        if (!result) {
          if (safety) {
            console.log(` > WARNING: ${line}`)
            console.log(`${entry}`)
            console.log("++++++++++++++++++++");
          } else {
            const tmp = line.split("=")[1];
            result = tmp.trim(); //.replace(",", "");
          }
        }
        articleObject[key] = result;
        break;
      }
    }
  }
  return articleObject;
}

const keySelection = {
  'article' : ["author", "title", "journal", "doi", "year", "eprint", "volume", "page", "url"],
  'inproceedings' : ["author", "title", "year", "eprint", "booktitle", "doi", "url"],
  'software' :  ["author", "title", "url", "doi", "year", "docs",],
};
function parseSelector(entry, mode) {
  let safe = true;
  if (mode == 'software') safe = false;
  let result = parseEntry(entry, keySelection[mode], safe);
  if (mode == 'software') {
    result.year = result.year.replace(",","");
    const title = result.title.match(/[^{^/]*(?=:)/);
    const description = result.title.match(/(?<=: ).*/) || title;
    result.title = title[0].replace("\\_", " ");
    result.description = description[0];
  };
  return result;
}

const keys = ['article', 'software', 'inproceedings'];
let bibInformation = {
  'article' : [],
  'software' : [],
}

// ++++ Read the input file, parse it, and write a json
fs.readFile(fileIn, (err, textContent) => {
  if (err) {
    return console.log(err);
  }
  // Read all information as entries
  const entries = getBibEntries(textContent.toString());
  // Now, parse each entry depending on their type
  for (let i in entries) {
    const entry = entries[i];
    for (let key of keys) {
      // If the key is accepted, parse it
      if (entry.includes(`@${key}`)) {
        let result = parseSelector(entry, key);
        if (key == 'inproceedings') {
          result["journal"] = result["booktitle"];
          key = 'article';
        }
        bibInformation[key].push(result);
        break;
      }
    }
  }

  // Order the items by date
  for (let key in bibInformation) {
    bibInformation[key].sort( (x,y) => {
      const xprint = x['eprint'];
      const yprint = y['eprint'];
      if (!xprint) return 1;
      if (xprint < yprint) {
        return 1;
      } else {
        return -1;
      }
    });
  }

  // Now make it into a json
  const jsonBib = JSON.stringify(bibInformation, null, 2);

  // And now write down the file
  fs.writeFile(fileOut, jsonBib, (err) => {
    if(err) {
      console.log(err);
    } else {
      console.log(`File saved to ${fileOut}`);
    }
  }); 
});
