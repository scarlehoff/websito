#!/usr/bin/env node

// This script and the associated utilities rely on me using a very specific syntax for my notes
// and will evolve alongside those
// At the moment this syntax is:
//
// <Author Name>.md
// ### Title of the book
// <date>
// Review
// ### Title of another book
// <date>
// Review

"use-strict";
const tools = require("./parseUtils");

// Argument 0 is the node executable
// and 1 this script
const input_md = process.argv[2];
let output_json = process.argv[3];
if ( output_json.charAt(0) != '/' ) {
  output_json = "./" + output_json;
}
tools.markdown2json(input_md, output_json);
