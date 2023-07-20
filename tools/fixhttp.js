const records = require('../data/records.json');
const fs = require('fs');
const path = require('path');

records.forEach((r, i) => records[i].type = 'http');
fs.writeFileSync(path.join(__dirname, '../data/records.json'), JSON.stringify(records));