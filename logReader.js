'use strict';
/* Look at the log folder, and every time a new log file appears
 * parse it and gzip it to the backup folder
 * Rudimentary but simpler and safer that alternatives
 */

// Imports
const fs = require('fs');
const mv = require('mv');

// Parameters
const basicLogName = "access.log";
const logFolder = "./log/";
const backupFolder = "./backupLog/";

// Create folders 
function checkCreate(folname) {
  if (!fs.existsSync(folname)) {
    console.log(`Creating ${folname}`);
    fs.mkdirSync(folname);
  }
}
checkCreate(logFolder);
checkCreate(backupFolder);

// Look for changes
// Read the new files
// And move them to the backup folder
function watchOnce() {
  const watcher = fs.watch(logFolder, (eventType, filename) => {
    watcher.close();

    if (eventType == "rename" && filename.endsWith(`-${basicLogName}`)) {
      console.log(`New event: ${eventType} - ${filename}`);
      // Move the file out of the way
      const originalPath = `${logFolder}/${filename}`;
      const finalPath = `${backupFolder}/${filename}`;
      mv(originalPath, finalPath, (err) => {
        console.log(err);
      });
    }

    // resurrect the watcher after a few seconds
    setTimeout(watchOnce, 5000);
  });
}

watchOnce();
