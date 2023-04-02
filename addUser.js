const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const argon2 = require('argon2-wasm-pro');
const fs = require('fs');

let username = process.argv[2];
if(username === 'run')username = process.argv[3];

if(!username)throw new Error('Username is required');

if(!fs.existsSync('data'))
    fs.mkdirSync('data');

if(!fs.existsSync('data/users.json'))
    fs.writeFileSync('data/users.json', '[]');

let users = JSON.parse(fs.readFileSync('data/users.json'));
let password = crypto.randomUUID();
let salt = crypto.randomBytes(32).toString('base64');

console.log(`Generating password for ${username}`);

argon2.hash({ pass: CryptoJS.SHA256(password).toString(), salt: salt }).then(h => {
    users.push({
        username: username,
        password: h.encoded,
        passwordChange: true,
        id: crypto.randomUUID(),
        salt: salt
    });
    
    fs.writeFileSync('data/users.json', JSON.stringify(users));
    
    console.log(`User ${username} created`);
    console.log(`Password: ${password}`);
}).catch(e => {
    throw new Error(e);
})