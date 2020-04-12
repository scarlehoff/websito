'use strict';
/* Look at the log folder, and every time a new log file appears
 * parse it and gzip it to the backup folder
 * Rudimentary but simpler and safer that alternatives
 */

// Imports
const fs = require('fs');
const mv = require('mv');
const chokidar = require('chokidar');

// Parameters
const basicLogName = "access.log";
const logFolder = "log/";
const backupFolder = "log/backupLog/";

// Create folders 
function checkCreate(folname) {
  if (!fs.existsSync(folname)) {
    console.log(`Creating ${folname}`);
    fs.mkdirSync(folname);
  }
}
checkCreate(logFolder);
checkCreate(backupFolder);

// TODO check the database exists, create if it doesn't

/*
 * Look for new file,
 * read them up (later on, write up the data to a db)
 * move the files to the backup folde
 */
const watcher = chokidar.watch(logFolder, {
  persistent: true,
  ignored: `${backupFolder}*`
});

watcher.on('add', (filename) => {
  // and move them to the backup folder
  if (filename.endsWith(`-${basicLogName}`)) {
    // Read the file up
    fs.readFile(filename, (err, textContent) => {
      if (err) return console.log(err);

      // TODO use the IP to get location information

      // TODO save data to database

    });
    // Move the file out of the way
    const finalPath = filename.replace(logFolder, backupFolder);
    console.log(`Moving ${filename} to ${finalPath}`);
    mv(filename, finalPath, (err) => {
      if (err) console.log(err);
    });
  }
});
