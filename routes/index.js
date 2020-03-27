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
  const pubInfo = require('../data/publications.json');
  const articles = pubInfo["article"];
  const software = pubInfo["software"];
  const talks = require('../data/talks.json');
  res.render('research', { title: 'Research', articles, software, talks });
});
router.get('/software', function(req, res, next) {
  res.render('software', { title: 'Software' });
});


module.exports = router;
