const fs = require('fs');
const http = require('http');
const https = require('https');
const ws = require('ws');
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

let handleWSRequest = ( w, preq ) => {
    console.log('WS request to '+preq.headers.host)
    try{
        let rec = records.find(r => r.domain === preq.headers.host.split(':')[0] && r.type === 'ws');
        if(!rec)
            return w.close();

        console.log('Connecting to: ws://'+rec.ip+':'+rec.port+preq.url);
        let originWS = new ws('ws://'+rec.ip+':'+rec.port+preq.url);

        originWS.on('message', ( msg ) => {
            console.log(msg);
            ws.send(msg.data);
        })

        originWS.on('error', ( err ) => {
            console.error(err);
            w.close();
        })

        w.on('message', ( msg ) => {
            console.log(msg);
            w.send(msg);
        });

        w.on('error', ( err ) => {
            console.error(err);
            originWS.close();
        }) 

        originWS.on('close', () => w.close());
        w.on('close', () => originWS.close());
    } catch(e){
        console.error(e);
        ws.close();
    }
}

let handleRequest = ( preq, pres ) => {
    try{
        let rec = records.find(r => r.domain === preq.headers.host && r.type === 'http');
        if(!rec){
            pres.writeHead(404, { 'Content-Type': 'text/html' });
            pres.write(errors[404]);

            pres.end();
            return;
        }

        let proxy = http.request({
            hostname: rec.ip,
            port: rec.port,
            path: preq.url,
            method: preq.method,
            headers: preq.headers
        }, ( res ) => {
            if(res.headers['x-powered-by'])
                res.headers['x-powered-by'] = res.headers['x-powered-by'] + ' (Firefly '+pkg.version+')';
            else
                res.headers['x-powered-by'] = 'Firefly '+pkg.version;

            pres.writeHead(res.statusCode, res.headers);
            res.pipe(pres, { end: true });
        });

        proxy.on('error', ( err ) => {
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

        let httpsServer = https.createServer(options, handleRequest).listen(443);
        let wsServer = new ws.Server({ noServer: true });

        httpsServer.on('upgrade', ( request, socket, head ) => {
            wsServer.handleUpgrade(request, socket, head, ( w ) => {
                w.emit('connection', w, request);
            });
        });

        wsServer.on('connection', handleWSRequest);
    }
}

let reloadRecords = () => {
    records = JSON.parse(fs.readFileSync('./data/records.json', 'utf8'));
}

module.exports = { main, reloadRecords };