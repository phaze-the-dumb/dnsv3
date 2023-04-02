const { Elysia } = require('elysia');
const crypto = require('crypto');
const argon2 = require('argon2-wasm-pro');
const proxy = require('./proxy');
const fs = require('fs');

if(!fs.existsSync('data'))
    fs.mkdirSync('data');

if(!fs.existsSync('data/users.json'))
    fs.writeFileSync('data/users.json', '[]');

if(!fs.existsSync('data/records.json'))
    fs.writeFileSync('data/records.json', '[]');

let sessions = [];

let main = async ( port, proxyPort ) => {
    let app = new Elysia();
    proxy.main(proxyPort);

    app.get('/', () => Bun.file('views/panel.html'));

    app.get('/assets/css/main.css', () => Bun.file('assets/css/main.css'));
    app.get('/assets/js/bundle.js', () => Bun.file('assets/js/bundle.js'));

    app.get('/api/v1/user', ({ request }) => {
        let session = request.headers.get('auth');
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return JSON.stringify({ ok: false, error: 'Invalid session' });

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return JSON.stringify({ ok: false, error: 'Session expired' });
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return JSON.stringify({ ok: false, error: 'User doesn\'t exist' });

        return JSON.stringify({ 
            ok: true,
            username: user.username,
            passwordChange: user.passwordChange,
            expires: usess.time + 8.64e+7
        });
    })

    app.get('/api/v1/records', ({ request }) => {
        let session = request.headers.get('auth');
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return JSON.stringify({ ok: false, error: 'Invalid session' });

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return JSON.stringify({ ok: false, error: 'Session expired' });
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return JSON.stringify({ ok: false, error: 'User doesn\'t exist' });

        return fs.readFileSync('data/records.json', 'utf8');
    })

    app.post('/api/v1/records', async ({ request, body }) => {
        let session = request.headers.get('auth');
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return JSON.stringify({ ok: false, error: 'Invalid session' });

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return JSON.stringify({ ok: false, error: 'Session expired' });
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return JSON.stringify({ ok: false, error: 'User doesn\'t exist' });

        let records = JSON.parse(fs.readFileSync('data/records.json', 'utf8'));
        records.push({
            user: user.id,
            userUsername: user.username,
            time: Date.now(),
            domain: body.record.domain,
            ip: body.record.ip,
            port: body.record.port,
            id: crypto.randomUUID()
        });

        fs.writeFileSync('data/records.json', JSON.stringify(records));
        proxy.reloadRecords();
        return JSON.stringify({ ok: true });
    })

    app.post('/api/v1/auth', async ({ body }) => {
        if(!body)return JSON.stringify({ ok: false, error: 'Bad Request' });
        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = null;

        for (let i = 0; i < users.length; i++) {
            let password = (await argon2.hash({ pass: body[1], salt: users[i].salt })).encoded;

            if(
                users[i].password == password &&
                users[i].username == body[0]
            ) user = users[i];
        }

        if(!user)return JSON.stringify({ ok: false, error: 'Incorrect Username or Password' });
        sessions = sessions.filter(x => x.id !== user.id);

        let sessionData = {
            id: user.id,
            session: crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID(),
            time: Date.now()
        }

        sessions.push(sessionData);
        return JSON.stringify({ ok: true, session: sessionData.session });
    })

    app.post('/api/v1/auth/reset', async ({ body, request }) => {
        let session = request.headers.get('auth');
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return JSON.stringify({ ok: false, error: 'Invalid session' });

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return JSON.stringify({ ok: false, error: 'Session expired' });
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return JSON.stringify({ ok: false, error: 'User doesn\'t exist' });

        if(!body)return JSON.stringify({ ok: false, error: 'Bad Request' });
        let password = (await argon2.hash({ pass: body.password, salt: user.salt })).encoded;

        user.password = password;
        user.passwordChange = false;

        fs.writeFileSync('data/users.json', JSON.stringify(users));
        return JSON.stringify({ ok: true });
    })

    app.post('/api/v1/records/:id', ({ params: { id }, request, body }) => {
        let session = request.headers.get('auth');
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return JSON.stringify({ ok: false, error: 'Invalid session' });

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return JSON.stringify({ ok: false, error: 'Session expired' });
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return JSON.stringify({ ok: false, error: 'User doesn\'t exist' });

        if(!id || !body || !body.ip || !body.port)
            return JSON.stringify({ ok: false, error: 'Bad Request' });

        let records = JSON.parse(fs.readFileSync('data/records.json', 'utf8'));
        
        let rec = records.find(x => x.id === id);
        rec.ip = body.ip;
        rec.port = body.port;

        fs.writeFileSync('data/records.json', JSON.stringify(records));
        proxy.reloadRecords();
        return JSON.stringify({ ok: true });
    })

    app.delete('/api/v1/records/:id', ({ params: { id }, request }) => {
        let session = request.headers.get('auth');
        let usess = sessions.find(s => s.session === session);

        if(!usess)
            return JSON.stringify({ ok: false, error: 'Invalid session' });

        if(usess.time - 8.64e+7 > Date.now()){
            sessions = sessions.filter(x => x.id !== usess.id);
            return JSON.stringify({ ok: false, error: 'Session expired' });
        }

        let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
        let user = users.find(x => x.id === usess.id);

        if(!user)
            return JSON.stringify({ ok: false, error: 'User doesn\'t exist' });

        if(!id)
            return JSON.stringify({ ok: false, error: 'Bad Request' });

        let records = JSON.parse(fs.readFileSync('data/records.json', 'utf8'));
        records = records.filter(x => x.id !== id);

        fs.writeFileSync('data/records.json', JSON.stringify(records));
        proxy.reloadRecords();
        return JSON.stringify({ ok: true });
    })

    app.onError(({ code, error }) => {
        if(code === 'NOT_FOUND')
            return Bun.file('views/404.html');

        console.error(error);
        return Bun.file('views/500.html');
    })

    app.listen(port);
}

module.exports = { main };