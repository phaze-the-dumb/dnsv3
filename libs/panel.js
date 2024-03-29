const fastify = require('fastify');
const crypto = require('crypto');
const argon2 = require('argon2');
const fs = require('fs');

if(!fs.existsSync('data'))
    fs.mkdirSync('data');

if(!fs.existsSync('data/users.json'))
    fs.writeFileSync('data/users.json', '[]');

if(!fs.existsSync('data/records.json'))
    fs.writeFileSync('data/records.json', '[]');

const proxy = require('./proxy');
let sessions = [];

let main = async ( port ) => {
    let app = fastify();
    proxy.main();

    app.get('/', ( req, res ) => {
        res.header('Content-Type', 'text/html');
        res.status(200); // Why the fuck did i write 404?
        res.send(fs.readFileSync('views/panel.html', 'utf8'));
        return;
    });

    app.get('/assets/css/main.css', ( req, res ) => res.send(fs.readFileSync('assets/css/main.css', 'utf8')));
    app.get('/assets/js/bundle.js', ( req, res ) => res.send(fs.readFileSync('assets/js/bundle.js', 'utf8')));

    app.get('/api/v1/user', ( req, res ) => {
        let session = req.headers.auth;
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return res.send(JSON.stringify({ ok: false, error: 'Invalid session' }));

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return res.send(JSON.stringify({ ok: false, error: 'Session expired' }));
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return res.send(JSON.stringify({ ok: false, error: 'User doesn\'t exist' }));

        res.send(JSON.stringify({ 
            ok: true,
            username: user.username,
            passwordChange: user.passwordChange,
            expires: usess.time + 8.64e+7
        }));
    })

    app.get('/api/v1/records', ( req, res ) => {
        let session = req.headers.auth;
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return res.send(JSON.stringify({ ok: false, error: 'Invalid session' }));

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return res.send(JSON.stringify({ ok: false, error: 'Session expired' }));
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return res.send(JSON.stringify({ ok: false, error: 'User doesn\'t exist' }));

        res.send(fs.readFileSync('data/records.json', 'utf8'));
    })

    app.post('/api/v1/records', ( req, res ) => {
        let session = req.headers.auth;
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return res.send(JSON.stringify({ ok: false, error: 'Invalid session' }));

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return res.send(JSON.stringify({ ok: false, error: 'Session expired' }));
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return res.send(JSON.stringify({ ok: false, error: 'User doesn\'t exist' }));

        let body = req.body;
        let records = JSON.parse(fs.readFileSync('data/records.json', 'utf8'));

        records.push({
            user: user.id,
            userUsername: user.username,
            time: Date.now(),
            domain: body.record.domain,
            ip: body.record.ip,
            port: body.record.port,
            type: body.record.type,
            id: crypto.randomUUID()
        });

        fs.writeFileSync('data/records.json', JSON.stringify(records));
        proxy.reloadRecords();
        res.send(JSON.stringify({ ok: true }));
    })

    app.post('/api/v1/auth', async ( req, res ) => {
        let body = req.body;
        if(!body)res.send(JSON.stringify({ ok: false, error: 'Bad Request' }));
        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = null;

        for (let i = 0; i < users.length; i++) {
            try{
                let password = await argon2.verify( users[i].password, body[1] );

                if(
                    password &&
                    users[i].username == body[0]
                ) user = users[i];
            } catch(e){}
        }

        if(!user)return res.send(JSON.stringify({ ok: false, error: 'Incorrect Username or Password' }));
        sessions = sessions.filter(x => x.id !== user.id);

        let sessionData = {
            id: user.id,
            session: crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID(),
            time: Date.now()
        }

        sessions.push(sessionData);
        res.send(JSON.stringify({ ok: true, session: sessionData.session }));
    })

    app.post('/api/v1/auth/reset', async ( req, res ) => {
        let session = req.headers.auth;
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return res.send(JSON.stringify({ ok: false, error: 'Invalid session' }));

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return res.send(JSON.stringify({ ok: false, error: 'Session expired' }));
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return res.send(JSON.stringify({ ok: false, error: 'User doesn\'t exist' }));

        let body = req.body;
        if(!body)return res.send(JSON.stringify({ ok: false, error: 'Bad Request' }));
        let password = await argon2.hash( body.password, { type: argon2.argon2id, hashLength: 50 } );

        user.password = password;
        user.passwordChange = false;

        fs.writeFileSync('data/users.json', JSON.stringify(users));
        res.send(JSON.stringify({ ok: true }));
    })

    app.post('/api/v1/records/:id', (req, res) => {
        let session = req.headers.auth;
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return res.send(JSON.stringify({ ok: false, error: 'Invalid session' }));

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return res.send(JSON.stringify({ ok: false, error: 'Session expired' }));
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return res.send(JSON.stringify({ ok: false, error: 'User doesn\'t exist' }));

        let body = req.body;
        if(!body)return res.send(JSON.stringify({ ok: false, error: 'Bad Request' }));

        if(!req.params.id || !body || !body.ip || !body.port)
            return res.send(JSON.stringify({ ok: false, error: 'Bad Request' }));

        let records = JSON.parse(fs.readFileSync('data/records.json', 'utf8'));
        
        let rec = records.find(x => x.id === req.params.id);
        rec.ip = body.ip;
        rec.port = body.port;

        fs.writeFileSync('data/records.json', JSON.stringify(records));
        proxy.reloadRecords();
        res.send(JSON.stringify({ ok: true }));
    })

    app.delete('/api/v1/records/:id', ( req, res ) => {
        let session = req.headers.auth;
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return res.send(JSON.stringify({ ok: false, error: 'Invalid session' }));

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return res.send(JSON.stringify({ ok: false, error: 'Session expired' }));
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return res.send(JSON.stringify({ ok: false, error: 'User doesn\'t exist' }));

        if(!req.params.id)
            return res.send(JSON.stringify({ ok: false, error: 'Bad Request' }));

        let records = JSON.parse(fs.readFileSync('data/records.json', 'utf8'));
        records = records.filter(x => x.id !== req.params.id);

        fs.writeFileSync('data/records.json', JSON.stringify(records));
        proxy.reloadRecords();
        res.send(JSON.stringify({ ok: true }));
    })

    console.log('Panel listening on port ' + port);
    app.listen({ port, host: '0.0.0.0' });
}

module.exports = { main };
