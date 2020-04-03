let express = require('express');
let router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
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
  res.render('resume', { title: 'Resume', resume });
});


module.exports = router;
