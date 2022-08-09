#!/usr/bin/node

// This script relies on me using a very specific syntax for my notes
// and will evolve alongside those
// At the moment this syntax is:
//
// ## Author
// ### Title of the book
// <date>
// Review
// ### Title of another book
// <date>
// Review

'use-strict';
const fs = require('fs');
const md = require('markdown-it')();

const target = "libros.md";
const output = "libros.json";

function parseBook(stringBook) {
  const stringSplit = stringBook.split("\n");
  return {
    "title": stringSplit[0],
    "date": stringSplit[1],
    "review": md.render(stringSplit.slice(2).join("\n"))
  }
}

function parseAuthor(stringAuthor) {
  // Parse an entry into an object with:
  // full_name: full name of author
  // books: [
  //      { title: titulo
  //        review: review
  //        fecha: fecha de lectura
  //        }
  const entries = stringAuthor.split("\n### ");
  const author_name = entries[0];
  let books = [];
  for (let bookContent of entries.slice(1)) {
    books.push(parseBook(bookContent));
  }
  return {
    "full_name": author_name,
    "books": books,
  }
}


async function wikiAuthor(author, lang="es") {
  // Get information about the author through the wikipedia API
  const api_endpoint=`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${author}`
  const author_data = await fetch(api_endpoint).then( (response) => {
    return response.json()
  }).then( (data) => {
    const thumb = data.thumbnail;
    if (thumb) {
      return {
        "thumb": thumb.source,
        "summary": data.extract,
        "wiki": data.content_urls.desktop.page
      }
    }
  }).catch( (err) => {
    console.log(err);
  });
  if (lang == "es" && !author_data) return wikiAuthor(author, lang="en");
  return author_data;
}

async function noteEntries(rawString) {
  // Read the raw content of the note and separate it by entries
  // relying on the fact that
  //  1. Each author starts with \n## Author
  //  2. Each book within an author starts with \n### Title
  // Removes also header and footer
  //
  // Then parses each entry and each book
  
  const separator = "---";
  const noteContent = rawString.split(separator)[2];
  let authors = {};
  for (let authorContent of noteContent.split("\n## ").slice(1)) {
    const tmp = parseAuthor(authorContent);
    const wikiData = await wikiAuthor(tmp.full_name);
    authors[tmp.full_name.split(" ").pop()] = {...wikiData, ...tmp};
  }
  return authors;
}

fs.readFile(target, (err, textContent) => {
  if (err) return console.log(err);

  noteEntries(textContent.toString()).then( (entries) => {
    const jsonLib = JSON.stringify(entries, null, 2);

    // And now write down the file
    fs.writeFile(output, jsonLib, (err) => {
      if(err) {
        console.log(err);
      } else {
        console.log(`File saved to ${output}`);
      }
    });
  }).catch( (err) => console.log(err) );

});
