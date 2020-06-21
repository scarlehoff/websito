/**
 * This module exports several middleware functions
 * with a signature (req, res, next) 
 * to blacklist IP that do suspicious stuff
 *
 * External functions:
 *  blockOrMark:
 *    mark IP as suspicious and, if it is already suspicious
 *    blacklist it
 *  checkAndBlock:
 *    checks whether the APP is in the blacklist and block it if so
 */

// dynamic list of blocked ips
let ipSuspicious = [];
let ipBlackList = [];

// Time (in miliseconds) that an IP will be blocked
const banTime = 30*60*1000;

// Set the functions that act on the ip lists
// these functions take an ip and output a text/plain response
/*
 * Add an IP to the list of suspicious IPs
 */
function isSuspicious(userIP) {
    console.log("Adding userIP to the suspicious list: ", userIP);
    ipSuspicious.push(userIP);
    return `Your access will be denied if you do something funny!`;
}

/*
 * Check whether an IP is in the list of
 * and add it to the blacklist if so
 */
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

/*
 * Check whether an IP is in the blacklist
 * and block it if so
 */
function checkAndBlock(req, res, next) {
  // Get the IP
  const userIP = req.header('X-Real-IP') || req.connection.remoteAddress;
  if (ipBlackList.indexOf(userIP) === -1) {
    next();
  } else {
    console.log("Blocked access to ", userIP);
    res.type('text/plain')
    res.send('Access Denied');
  }
}

/*
 * Wrapper to add IPs to the suspicious list
 * and, if it is already there, to the blacklist
 */
function blockOrMark(req, res, next) {
  const userIP = req.header('X-Real-IP') || req.connection.remoteAddress;
  res.type('text/plain')
  // Check whether the IP is suspicious, if it is
  // add it to the blocking list
  if (ipSuspicious.indexOf(userIP) > -1) {
    res.send(blockIfSuspicious(userIP));
  } else {
    // tell the visitor you are marking it as suspicious
    res.send(isSuspicious(userIP));
  }
}

module.exports = {
  checkAndBlock,
  blockOrMark
}
