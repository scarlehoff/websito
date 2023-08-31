"use-strict";
const md = require("markdown-it")();
const fs = require("fs");

function parseBook(stringBook) {
  const stringSplit = stringBook.split("\n");
  return {
    title: stringSplit[0],
    date: stringSplit[1],
    review: md.render(stringSplit.slice(2).join("\n")),
  };
}


function parseAuthorNote(rawAuthorString) {
  // Read the content of the markdown file as raw
  // and separate the entries by book
  // Each input string should correspond to a single author
  //
  // Outputs a list of books with:
  //  { title, rewiew, date }

  const separator = "---";
  const noteContent = rawAuthorString.split(separator)[2];

  let books = [];
  for (const entry of noteContent.split("\n### ").slice(1)) {
    books.push(parseBook(entry));
  }
  return books;
}

async function wikiAuthor(entry, lang = "es") {
  // Receives an entry and adds metadata to it
  author = entry.full_name;
  // Get information about the author through the wikipedia API
  const api_endpoint = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${author}`;
  console.log(api_endpoint);
  const author_data = await fetch(api_endpoint)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      // Parse the data
      let thumb = null;
      if (data.thumbnail) thumb = data.thumbnail.source;

      let summary = null;
      let wiki = null;

      if (data.pageid) {
        summary = data.extract;
        wiki = data.content_urls.desktop.page
      }

      return {
        thumb,
        summary,
        wiki
      };
    })
    .catch((err) => {
      console.log(err);
    });

  // Let's check whether we have all information now, if now, try to get also from EN
  if (lang == "es") {
    if (!author_data.summary) {
      return wikiAuthor(entry, (lang = "en"));
    } else if (!author_data.thumb) {
      const data_eng = wikiAuthor(entry, (lang = "en"));
      author_data.thumb = data_eng.thumb;
    }
  }

  entry.meta = author_data;
  return entry;
}

function markdown2json(target, output) {
  // Reads the markdown <target> file
  // and outputs the content into the <output> file (which should be .json)
  // If the output already contain .json information, read it up
  // 
  // The format of the note is such that
  // target: <author>.md
  //  and the content of the author.md is
  //  ### Book
  //  date
  //  review
  //  ### Book
  //  date
  //  review
  //

  // Read the target md
  const textContent = fs.readFileSync(target);

  // Parse the content of the note
  // const entries = noteEntries(textContent.toString());
  const books = parseAuthorNote(textContent.toString());
  const author = target.substring(target.lastIndexOf("/")+1, target.lastIndexOf("."));
  const authorShort = author.split(" ").pop();

  // Check whether we already have any JSON and read if if that's the case
  // check whether we have already the author and update the book field
  // otherwise, look for metadata and create a new entry
  let currentJson = {};
  const newEntry = {
    full_name: author,
    short: authorShort,
    books: books,
  }

  if (fs.existsSync(output)) {
    currentJson = require(output);
    if (currentJson[authorShort]) {
      currentJson[authorShort].books = books;
    } else {
      currentJson[authorShort] = newEntry;
    }
  } else {
    currentJson[authorShort] = newEntry;
  }

  // Now loop over the entire "currentJson" to fill in any authors
  // that have no metadata (loop also over the old ones, just in case)
  let promises = [];
  for (const entry of Object.values(currentJson)) {
    if (entry.meta && entry.meta.summary) {
      promises.push(entry);
    } else {
      promises.push(wikiAuthor(entry));
    }
  }

  // We put all entries in the "promises" list
  // which might be looking over wikipedia to add information
  // once that's done, organize the author list and output the new json

  Promise.all(promises).then((fullfilled) => {
    // Organize the list of authors as an object key: data
    // where key is the short name of the author to facilitate indexing
    let jsonable = {};
    for (const entry of fullfilled) {
      jsonable[entry["short"]] = entry;
    }
    const jsonLib = JSON.stringify(jsonable, null, 2);
    // And now write down the file
    fs.writeFile(output, jsonLib, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
}

module.exports = {
  markdown2json,
};
