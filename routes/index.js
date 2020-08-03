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
  res.render('index', { title: 'Juan Manuel Cruz Martinez, PhD' });
});

router.get('/teaching', function(req, res, next) {
  res.render('teaching', { title: 'Teaching' });
});

router.get('/research', function(req, res, next) {
  const research = require('../data/research.json')
  const pubInfo = require('../data/publications.json');
  const articles = pubInfo["article"];
  const software = pubInfo["software"];
  const talks = require('/data/talks.json');
  res.render('research', { title: 'Research', articles, software, talks, research});
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

router.get('/stats', function(req, res, next) {
  res.render('stats', { title: 'Stats' });
});

router.get('/publicatonDigestor', function(req, res, next) {
  res.render('pubdigest', { title: 'Publications Applet' });
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

router.get('/blog', function(req, res, next) {
  res.render('blog/blog', { title: 'Blog: Tips & Tricks', registers: registros });
});

router.get('/robots.txt', (req, res, next) => {
  res.type('text/plain')
  res.send("User-agent: *\nDisallow: /honey.pot");
});

router.get('/honey.pot', securitySite.blockOrMark);

module.exports = router;
