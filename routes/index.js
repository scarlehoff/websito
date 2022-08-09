let express = require('express');
let router = express.Router();
let securitySite = require('./securitySite');
let fs = require('fs');
let path = require('path');
let createError = require('http-errors');
// get syntax highlighting for the blog
let hljs = require('highlight.js');
// use markdownit to convert the blog posts (written in github-style markdown) to html
let md = require('markdown-it')({
  highlight: function (str, lang) {
    let res = null;
    if (lang && hljs.getLanguage(lang)) {
      try {
        res = hljs.highlight(lang, str, true).value;
      } catch (__) {}
    } else {
      res = hljs.highlightAuto(str).value;
    }
    return res;
  }
});

// Add the blocking middleware to all routes
router.use( securitySite.checkAndBlock );

// Get the registers for the blog
const registros = require('../data/blog/registros.json');
// Get the path of this file
let pathName = path.dirname(__filename);

// Parse icons
const iconmap = {
  'C' : 'devicon-c-plain',
  'C++' : 'devicon-cplusplus-plain',
  'python' : 'devicon-python-plain',
  'javascript' : 'devicon-javascript-plain',
  'nodejs' : 'devicon-nodejs-plain',
  'Linux' : 'devicon-linux-plain',
  'debian': 'devicon-debian-plain',
  'Vim' : 'devicon-vim-plain',
  'Version control' : 'devicon-git-plain',
  'GPU computing' : 'mdi mdi-expansion-card',
  'Mathematica, Maple' : 'mdi mdi-math-integral-box',
  'Latex & markdown' : 'mdi mdi-language-markdown',
  'fortran' : 'mdi mdi-language-fortran',
  'keras & tensorflow' : 'tf-plain',
  'Mac' : 'devicon-apple-original'
}

/* GET home page. */
router.get('/', function(req, res, next) {
//  let userIp = req.header('X-Real-IP') || req.connection.remoteAddress;
//  console.log(`Client ip: ${userIp}`);
  const nameTitle='Juan Manuel Cruz Martinez, PhD'
  res.render('index', { 
    title: nameTitle,
    headertitle: nameTitle,
    pagetitle: 'Juan Cruz-Martinez'});
});

router.get('/teaching', function(req, res, next) {
  res.render('teaching', { title: 'Teaching' });
});

router.get('/research', function(req, res, next) {
  const research = require('../data/research.json')
  const pubInfo = require('../data/publications.json');
  const articles = pubInfo["article"];
  const software = pubInfo["software"];
  const talks = require('../data/talks.json');
  res.render('research', {
    title: 'Research',
    articles,
    software,
    talks,
    research,
    'extra_content': md.render("If you want to check my contributions in iNSPIRE, you can use the following search string:  [`find a cruz-martinez, j`](https://inspirehep.net/literature?sort=mostrecent&size=25&page=1&q=find%20a%20cruz-martinez%2C%20j)")
  });
});

router.get('/software', function(req, res, next) {
  const development = require('../data/development.json');
  const projects = development["openSource"];
  const pastWork = development["pastWork"];
  res.render('software', { title: 'Software', projects, pastWork});
});

router.get('/resume', function(req, res, next) {
  const resume = require('../data/resume.json');
  res.render('resume', { title: 'Resume', resume, iconmap });
});


//----- JS Webapps -----
router.get('/stats', function(req, res, next) {
  res.render('stats', { title: 'Stats' });
});

router.get('/publicatonDigestor', function(req, res, next) {
  res.render('pubdigest', { title: 'Publications Applet' });
});

router.get('/todoapp', function(req, res, next) {
  res.render('todoapp', { title: 'Todo Applet' });
});

router.get('/biblioteca', function(req, res, next) {
  res.render('biblioteca/biblioteca', { title: 'Biblioteca' });
});

router.get('/biblioteca/:media', function(req, res, next) {
  const mediaType = req.params.media.toLowerCase();
  const library = require(`../data/biblioteca/${mediaType}.json`);
  const pagetitle = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
  res.render('biblioteca/media', {title: 'Biblioteca', pagetitle: pagetitle, library: library});
});

router.get('/biblioteca/:media/:author', function(req, res, next) {
  const mediaType = req.params.media.toLowerCase();
  const library = require(`../data/biblioteca/${mediaType}.json`)
  const author = req.params.author;
  let authorData = library[author];
  // If the author/console doesnt exist, send the user back to books
  if(!authorData) {
    res.redirect(308, `/biblioteca/${mediaType}`);
    return;
  }

  res.render('biblioteca/mediaDetail', 
    { title: 'Biblioteca',
      pagetitle: authorData.full_name,
      author: authorData,
      originMedia: mediaType,
    });
});

router.get('/videojuegos', function(req, res, next) {
  const library = require("../data/biblioteca/videojuegos.json")
  res.render('biblioteca/media', {title: 'Biblioteca', pagetitle: 'Videojuegos', library: library});
});

router.get('/blog', function(req, res, next) {
  res.render('blog/blog', { title: 'Blog: Tips & Tricks', registers: registros });
});


router.get('/blogpost', function(req, res, next) {
  const readme = req._parsedOriginalUrl.query;
  if(readme){
    // Check whether we have this readme available
    // if not, send a 404
    const readmeInfo = registros[readme];
    if (readmeInfo) {
      const filename = pathName + '/../data/blog/' + readmeInfo.input;
      fs.readFile(filename, 'utf8', (err, text) => {
        if (err) {
          // if we have any problems reading the file, fail
          next(createError(404));
        } else {
          res.render('blog/blogpost', {
            title: 'Blog: Tips & Tricks',
            content: md.render(text),
          });
        }
      });
    } else {
        // if the tutorial queried doesn't exist, fail
        next(createError(404));
    }
  } else {
    res.render('blog/blog', {
      title: 'Blog: Tips & Tricks',
    });
  }
});

router.get('/robots.txt', (req, res, next) => {
  res.type('text/plain')
  res.send("User-agent: *\nDisallow: /honey.pot");
});

router.get('/honey.pot', securitySite.blockOrMark);

module.exports = router;
