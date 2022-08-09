"use strict";
/* Look at the log folder, and every time a new log file appears
 * parse it and gzip it to the backup folder
 * Rudimentary but simpler and safer that alternatives
 */

// Imports
const fs = require("fs");
const mv = require("mv");
const chokidar = require("chokidar");
const sqlite3 = require("sqlite3");
const IPinfo = require("node-ipinfo");

// Parameters
const basicLogName = "access.log";
const logFolder = "log/";
const backupFolder = "log/backupLog/";
const dbName = "infovisits.db";
const infoTable = "info";
const ipTable = "iptab";
const dbTables = {
  [infoTable]: ["date", "web", "ip"],
  [ipTable]: ["date", "ip", "country", "region", "city", "geo", "fullresponse"],
};

// Read up IPinfo (https://ipinfo.io)
const ipToken = require("./ipinfodata.json")["token"];
const ipinfo = new IPinfo(ipToken);

// Create folders
function checkCreate(folname) {
  if (!fs.existsSync(folname)) {
    console.log(`Creating ${folname}`);
    fs.mkdirSync(folname);
  }
}
checkCreate(logFolder);
checkCreate(backupFolder);

// Connect to the database
let db = new sqlite3.Database(dbName);

// Creation bit, only gets executed if the table does not exists
function tableCreation(tableName, tableFields) {
  const sqCreation = tableFields.join(", ");
  const sqCreationQuery = `CREATE TABLE if not exists ${tableName} (${sqCreation})`;
  db.run(sqCreationQuery);
}
for (let key in dbTables) {
  tableCreation(key, dbTables[key]);
}
// TODO in principle it can happen that it gets
// to the code below beofre finishing the creation of new tables

/*
 * Look for new file,
 * read them up (later on, write up the data to a db)
 * move the files to the backup folde
 */
const watcher = chokidar.watch(logFolder, {
  persistent: true,
  ignored: `${backupFolder}*`,
});

/*
 * Running loop
 *
 * We watch for changes in the folder,
 * which happen every time a log is rotated
 * If the file contains any line, we parse them all into the database
 * and then we look over the unique IPs and try to get information about them
 * from ipinfo
 * Finally the log file is moved out to the backup folder
 *
 */
watcher.on("add", (filename) => {
  // and move them to the backup folder
  if (filename.endsWith(`-${basicLogName}`)) {
    // Read the file up
    fs.readFile(filename, (err, textContent) => {
      if (err) return console.log(err);

      // Get the information from the log as lines
      const lines = textContent.toString().split("\n");

      // Save all IP in an unique way
      const allIps = {};

      // Parse all lines and insert them in the db
      let q = new Array(dbTables[infoTable].length).fill("?");
      const infoInsertion = db.prepare(`INSERT INTO ${infoTable} VALUES (${q.join(",")})`);
      for (let line of lines) {
        if (!line) continue;
        if (line.includes("favicon.ico")) continue;
        const lineData = line.trim().split(" > ");
        infoInsertion.run(lineData);
        // Now look at the IP and save it if necessary
        const ip = lineData[2];
        if (!(ip in allIps)) allIps[ip] = lineData[0];
      }

      // Now look for information on the IPs and save them in a different table
      q = new Array(dbTables[ipTable].length).fill("?");
      const ipInsertion = db.prepare(`INSERT INTO ${ipTable} VALUES (${q.join(",")})`);
      for (let ip in allIps) {
        if (ip.includes("192.168.1.")) continue;
        ipinfo.lookupIp(ip).then((response) => {
          console.log(`\n > > Checking IP: ${ip}:`);
          console.log(response);
          const country = response.country;
          const region = response.region;
          const city = response.city;
          const geoloc = response.loc;
          // Once we have all the information, save it in the db
          const toDB = [allIps[ip], ip, country, region, city, geoloc, JSON.stringify(response)];
          ipInsertion.run(toDB);
        });
      }

      // Now we have parsed all the information from the log, we can move it out of the way
      const finalPath = filename.replace(logFolder, backupFolder);
      console.log(`Moving ${filename} to ${finalPath}`);
      mv(filename, finalPath, (err) => {
        if (err) console.log(err);
      });
    });
  }
});
