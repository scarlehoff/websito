#!/usr/bin/env node

// This script and the associated utilities rely on me using a very specific syntax for my notes
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

"use-strict";
const tools = require("./parseUtils");

// Books
tools.markdown2json("./libros.md", "./libros.json");

// Games
tools.markdown2json("./videojuegos.md", "./videojuegos.json");
