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

// Argument 0 is the node executable
// and 1 this script
const input_md = process.argv[2];
const output_json = "./" + process.argv[3];
tools.markdown2json(input_md, output_json);
