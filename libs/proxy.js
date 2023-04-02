const fs = require('fs');
const http = require('http');
const https = require('https');
const config = require('../config.json');
const pkg = require('../package.json');

let records = JSON.parse(fs.readFileSync('./data/records.json', 'utf8'));
let errors = {
    404: fs.readFileSync('views/404.html', 'utf8'),
    500: fs.readFileSync('views/500.html', 'utf8'),
    503: fs.readFileSync('views/503.html', 'utf8')
}

if(config.useSSL){
    if(!fs.existsSync('ssl')){
        fs.mkdirSync('ssl');

        console.log('Please put SSL certificate in ./ssl folder');
        process.exit(1);
    }
}

let handleRequest = ( preq, pres ) => {
    // console.log('Handing request: '+preq.method+' '+preq.headers.host+preq.url);
    try{
        let rec = records.find(r => r.domain === preq.headers.host);
        if(!rec){
            // console.log('404.');
            pres.writeHead(404, { 'Content-Type': 'text/html' });
            pres.write(errors[404]);

            pres.end();
            return;
        }

        // console.log('Proxying...');
        let proxy = http.request({
            hostname: rec.ip,
            port: rec.port,
            path: preq.url,
            method: preq.method,
            headers: preq.headers
        }, ( res ) => {
            // console.log('Response...');

            if(res.headers['server'])
                res.headers['server'] = res.headers['server'] + ' (Firefly '+pkg.version+')';
            else
                res.headers['server'] = 'Firefly '+package.version;

            pres.writeHead(res.statusCode, res.headers);
            res.pipe(pres, { end: true });
        });

        proxy.on('error', ( err ) => {
            // console.log('503.');
            console.error(err);

            pres.writeHead(503, { 'Content-Type': 'text/html' });
            pres.write(errors[503]);
            pres.end();
        });

        preq.pipe(proxy, { end: true });
    } catch(e){
        console.error(e);

        pres.writeHead(500, { 'Content-Type': 'text/html' });
        pres.write(errors[500]);
        pres.end();
    }
}

let main = () => {
    http.createServer(handleRequest).listen(80);

    if(config.useSSL){
        let options = {
            key: fs.readFileSync('./ssl/key.pem'),
            cert: fs.readFileSync('./ssl/cert.pem')
        }

        https.createServer(options, handleRequest).listen(443);
    }
}

let reloadRecords = () => {
    console.log('Reloading records...');
    records = JSON.parse(fs.readFileSync('./data/records.json', 'utf8'));
}

module.exports = { main, reloadRecords };