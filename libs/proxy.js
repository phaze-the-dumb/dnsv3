const fs = require('fs');

let records = JSON.parse(fs.readFileSync('./data/records.json', 'utf8'));

let main = ( port ) => {
    Bun.serve({
        port: port,
        async fetch( req ){
            let rec = records.find(x => x.domain === req.headers.get('host'));
            if(!rec)return new Response(Bun.file('views/404.html'));

            try{
                let preq = await fetch('http://' + rec.ip + ':' + rec.port + new URL(req.url).pathname, {
                    method: req.method,
                    headers: req.headers.toJSON(),
                    body: req.body
                });

                return preq;
            } catch(e){
                console.error(e);
                return new Response(Bun.file('views/503.html'));
            }
        },
        error( err ){
            console.error(err);
            return new Response(Bun.file('views/500.html'));
        }
    })
}

let reloadRecords = () => {
    console.log('Reloading records...');
    records = JSON.parse(fs.readFileSync('./data/records.json', 'utf8'));
}

module.exports = { main, reloadRecords };