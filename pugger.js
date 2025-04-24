const fs = require('node:fs');
const path = require('node:path');
const pug = require('pug');

const viewsPath = path.join(__dirname, "views");
const outputPath = path.join(__dirname, "static_version");

/* Compiles <file>.pug intro <file>.html given the set of options
  */
function pugToHTML(filename, config) {
  const pugFile = pug.compileFile(path.join(viewsPath, `${filename}.pug`));
  const outFile = path.join(outputPath, `${filename}.html`);
  const outHTML = pugFile(config);

  fs.writeFile(outFile, outHTML, err => {
    if (err) {
      console.error(err);
    } else {
      console.log(`File written to ${outFile}`);
    }
  });
}


const nameTitle = "Juan Manuel Cruz Martinez, PhD";

pugToHTML("index", {
    title: nameTitle,
    headertitle: nameTitle,
    pagetitle: "Juan Cruz-Martinez",
});
