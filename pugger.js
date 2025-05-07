const fs = require('node:fs');
const path = require('node:path');
const pug = require('pug');
const hljs = require('highlight.js');
const MarkDownIt = require('markdown-it');

//// use markdownit to convert the blog posts (written in github-style markdown) to html
const md = new MarkDownIt({
  highlight: function (str, lang) {
    let res = null;
    if (lang && hljs.getLanguage(lang)) {
      try {
        res = hljs.highlight(lang, str, true).value;
      } catch (err) { console.log("Error with markdown-it", err); }
    } else {
      res = hljs.highlightAuto(str).value;
    }
    return res;
  },
});

const viewsPath = path.join(__dirname, "views");
const outputPath = path.join(__dirname, "static_version");
const dataPath = path.join(__dirname, "data");

/* Compiles <file>.pug intro <file>.html given the set of options
  */
function pugToHTML(filename, config, pugfilename = null) {
  if (!pugfilename) pugfilename = filename;

  const pugFile = pug.compileFile(
    path.join(viewsPath, `${pugfilename}.pug`),{basedir: viewsPath}
  );
  let outFile;
  if (filename == "index") {
    outFile = path.join(outputPath, `${filename}.html`);
  } else {
    const folderPath = path.join(outputPath, filename);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, {recursive: true});
    outFile = path.join(folderPath, `index.html`);
  }

  const outHTML = pugFile(config, );

  fs.writeFile(outFile, outHTML, err => {
    if (err) {
      console.error(err);
    } else {
      console.log(`File written to ${outFile}`);
    }
  });
}

// Variables and json files
const nameTitle = "Juan Manuel Cruz Martinez, PhD";
// Research
const research = require(path.join(dataPath, "research.json"));
const pubInfo = require(path.join(dataPath, "publications.json"));
const talks = require(path.join(dataPath, "talks.json"));

// Software
const development = require(path.join(dataPath, "development.json"));
const projects = development["openSource"];
const pastWork = development["pastWork"];

// CV
const resumeData = require(path.join(dataPath, "resume.json"));
const iconmap = {
  "C": "devicon-c-plain",
  "C++": "devicon-cplusplus-plain",
  "python": "devicon-python-plain",
  "javascript": "devicon-javascript-plain",
  "nodejs": "devicon-nodejs-plain",
  "Linux": "devicon-linux-plain",
  "debian": "devicon-debian-plain",
  "Vim": "devicon-vim-plain",
  "Version control": "devicon-git-plain",
  "GPU computing": "mdi mdi-expansion-card",
  "Mathematica, Maple": "mdi mdi-math-integral-box",
  "Latex & markdown": "mdi mdi-language-markdown",
  "fortran": "mdi mdi-language-fortran",
  "keras & tensorflow": "tf-plain",
  "Mac": "devicon-apple-original",
};

// Biblioteca
const library = require(path.join(dataPath, "biblioteca", "libros.json"));


// Conversiones
pugToHTML("index", {
    title: nameTitle,
    headertitle: nameTitle,
    pagetitle: "Juan Cruz-Martinez",
});

pugToHTML("research", {
    title: "Research",
    articles: pubInfo["article"],
    software: pubInfo["software"],
    talks,
    research,
    extra_content: md.render(
      "If you want to check my contributions in iNSPIRE, you can use the following search string:  [`find a cruz-martinez, j`](https://inspirehep.net/literature?sort=mostrecent&size=25&page=1&q=find%20a%20cruz-martinez%2C%20j)"
    ),
});

pugToHTML("software", {
  title: "Software",
  projects,
  pastWork
});

pugToHTML("resume", {
  title: "Resume",
  resume: resumeData,
  iconmap
});

//pugToHTML("biblioteca", {
//  title: "Biblioteca"
//},
//  "biblioteca/biblioteca"
//);
//
//pugToHTML("biblioteca/libros", {
//  title: "Biblioteca",
//  pagetitle: "Libros",
//  library
//},
//  "biblioteca/media"
//);
//
//// Create all authors
//for (const [key, authorData] of Object.entries(library)) {
//  pugToHTML(`biblioteca/Libros/${key}`, {
//    title: "Biblioteca",
//    pagetitle: authorData.full_name,
//    author: authorData,
//    originMedia: "libros"
//  },
//    "biblioteca/mediaDetail"
//  );
//}


// -- JS Webapps --
pugToHTML("publicatonDigestor", {title: "Publications Apple"}, "pubdigest");
pugToHTML("stats", {title: "Mapping Stats"});
