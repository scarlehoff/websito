let express = require('express');
let router = express.Router();
// dynamic list of blocked ips
let ipSuspicious = [];
let ipBlackList = [];
// Set the functions that act on the ip lists
// these functions take an ip and output a text/plain response
const banTime = 30*60*1000;
function isSuspicious(userIP) {
    console.log("Adding userIP to the suspicious list: ", userIP);
    ipSuspicious.push(userIP);
    return `Your access will be denied if you do something funny!`;
}
function blockIfSuspicious(userIP) {
    console.log("Adding userIP to the blacklist: ", userIP);
    ipBlackList.push(userIP);
    setTimeout( () => {
      const i = ipBlackList.indexOf(userIP);
      console.log("Lifted ban to: ", userIP);
      ipBlackList.splice(i, 1);
    }, banTime);
    const i  = ipSuspicious.indexOf(userIP);
    ipSuspicious.splice(i, 1);
    return `Access Denied to ${userIP} (for 30 minutes)!`
}

// Add the blocking middleware to all routes

router.use( function(req, res, next) {
  // Get the IP
  const userIP = req.header('X-Real-IP') || req.connection.remoteAddress;
  if (ipBlackList.indexOf(userIP) === -1) {
    next();
  } else {
    console.log("Blocked access to ", userIP);
    res.type('text/plain')
    res.send('Access Denied');
  }
})

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

router.get('/stats', function(req, res, next) {
  res.render('stats', { title: 'Stats' });
});

router.get('/publicatonDigestor', function(req, res, next) {
  res.render('pubdigest', { title: 'Publications Applet' });
});

router.get('/robots.txt', (req, res, next) => {
  res.type('text/plain')
  res.send("User-agent: *\nDisallow: /honey.pot");
});

router.get('/honey.pot', (req, res, next) => {
  const userIP = req.header('X-Real-IP') || req.connection.remoteAddress;
  console.log(userIP);
  console.log(ipSuspicious);
  res.type('text/plain')
  // Check whether the IP is suspicious, if it is
  // add it to the blocking list
  if (ipSuspicious.indexOf(userIP) > -1) {
    res.send(blockIfSuspicious(userIP));
  } else {
    // tell the visitor you are marking it as suspicious
    res.send(isSuspicious(userIP));
  }
});

module.exports = router;
