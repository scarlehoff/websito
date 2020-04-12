'use strict';
/* Look at the log folder, and every time a new log file appears
 * parse it and gzip it to the backup folder
 * Rudimentary but simpler and safer that alternatives
 */

// Imports
const fs = require('fs');
const mv = require('mv');
const chokidar = require('chokidar');
const sqlite3 = require('sqlite3');

// Parameters
const basicLogName = "access.log";
const logFolder = "log/";
const backupFolder = "log/backupLog/";
const dbName = 'infovisits.db';
const tableName = 'info';
const fieldsInfo = {
  'date' : 'TEXT',
  'web' : 'TEXT',
  'ip' : 'TEXT',
  'country' : 'TEXT',
  'extra' : 'TEXT',
};

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
let sqCreation = [];
let fields = [];
let questions = [];
for (let k in fieldsInfo) {
  sqCreation.push(`${k} ${fieldsInfo[k]}`)
  fields.push(k);
  questions.push('?')
}
const dbInsertionQuery = db.prepare(`INSERT INTO ${tableName} VALUES (${questions.join(',')})`);
const sqCreationQuery = `CREATE TABLE if not exists ${tableName} (${sqCreation.join(', ')})`
//console.log(sqCreationQuery);
db.run(sqCreationQuery);

/*
 * Look for new file,
 * read them up (later on, write up the data to a db)
 * move the files to the backup folde
 */
const watcher = chokidar.watch(logFolder, {
  persistent: true,
  ignored: `${backupFolder}*`
});

function parseIntoDb(line) {
  if (line) {
    const items = line.trim().split(" > ");
    console.log(items);
    dbInsertionQuery.run(items);
    // TODO use the IP to get location information
  }
}

watcher.on('add', (filename) => {
  // and move them to the backup folder
  if (filename.endsWith(`-${basicLogName}`)) {
    // Read the file up
    fs.readFile(filename, (err, textContent) => {
      if (err) return console.log(err);
      // Get the information from the log
      const lines = textContent.toString().split("\n");

      // save data to database
      lines.forEach( (item, index) => {
        parseIntoDb(item);
      });


    });
    // Move the file out of the way
    const finalPath = filename.replace(logFolder, backupFolder);
    console.log(`Moving ${filename} to ${finalPath}`);
//    mv(filename, finalPath, (err) => {
//      if (err) console.log(err);
//    });
  }
});
