var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
});
router.get('/teaching', function(req, res, next) {
  res.render('teaching', { title: 'Teaching' });
});
router.get('/research', function(req, res, next) {
  res.render('research', { title: 'Research' });
});
router.get('/software', function(req, res, next) {
  res.render('software', { title: 'Software' });
});


module.exports = router;
