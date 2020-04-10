let express = require('express');
let router = express.Router();

// Parse icons
const iconmap = {
  'C++' : 'devicon-cplusplus-plain',
  'python' : 'devicon-python-plain',
  'javascript' : 'devicon-javascript-plain',
  'Linux' : 'devicon-linux-plain',
  'Vim' : 'devicon-vim-plain',
  'Version control' : 'devicon-git-plain',
  'GPU computing' : 'mdi mdi-expansion-card',
  'Mathematica, Maple' : 'mdi mdi-math-integral-box',
  'Latex & markdown' : 'mdi mdi-language-markdown',
  'fortran' : 'mdi mdi-language-fortran',
  'keras & tensorflow' : 'tf-plain',
}

/* GET home page. */
router.get('/', function(req, res, next) {
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
  const talks = require('../data/talks.json');
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


module.exports = router;
