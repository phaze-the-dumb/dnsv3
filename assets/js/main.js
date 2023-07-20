const CryptoJS = require("crypto-js");

let username = document.querySelector("#username-input");
let password = document.querySelector("#password-input");
let password1 = document.querySelector("#passreset-input");
let password2 = document.querySelector("#passreset-input-confirm");
let newRecDomain = document.querySelector("#newrec-domain");
let newRecIP = document.querySelector("#newrec-ip");
let newRecPort = document.querySelector("#newrec-port");
let newRecType = document.querySelector("#newrec-type");
let currentNotif = null;
let session = localStorage.getItem("session");
let currentRecord = null;

let login = async () => {
    try{
        document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, -50%) rotateY(180deg)';
        setTimeout(() => {
            let children = document.querySelector('.login').children;
            
            for(let i = 0; i < children.length; i++){
                if(children[i].className.includes('flip-side')){
                    children[i].style.transition = '0s';
                    children[i].style.opacity = 1;
                } else {
                    children[i].style.transition = '0s';
                    children[i].style.opacity = 0;
                }
            }
        }, 150);

        let body = [
            username.value,
            password.value
        ]

        body[1] = CryptoJS.SHA256(body[1]).toString();

        let req = await fetch('/api/v1/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        let data = await req.json();

        if(data.ok){
            session = data.session;
            setTimeout(() => loadUser(), 500);
        } else{
            notify({ title: 'Error', body: data.error });

            setTimeout(() => {
                document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, -50%) rotateY(0deg)';
                setTimeout(() => {
                    let children = document.querySelector('.login').children;
                    
                    for(let i = 0; i < children.length; i++){
                        if(children[i].className.includes('flip-side')){
                            children[i].style.transition = '0s';
                            children[i].style.opacity = 0;
                        } else {
                            children[i].style.transition = '0s';
                            children[i].style.opacity = 1;
                        }

                        children[i].style.removeProperty('transition');
                    }
                }, 150);
            }, 1000);
        }
    } catch(e){
        notify({ title: 'Error', body: e.toString() });

        setTimeout(() => {
            document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, -50%) rotateY(0deg)';
            setTimeout(() => {
                let children = document.querySelector('.login').children;
                
                for(let i = 0; i < children.length; i++){
                    if(children[i].className.includes('flip-side')){
                        children[i].style.transition = '0s';
                        children[i].style.opacity = 0;
                    } else {
                        children[i].style.transition = '0s';
                        children[i].style.opacity = 1;
                    }
                    
                    children[i].style.removeProperty('transition');
                }
            }, 150);
        }, 1000);
    }
}

let loadUser = async () => {
    let req = await fetch('/api/v1/user', {
        method: 'GET',
        headers: {
            auth: session
        }
    });

    let json = await req.json();

    if(!json.ok)
        return notify({ title: 'Error', body: json.error });

    if(json.passwordChange){
        document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, -50%) rotateY(0deg)';
        setTimeout(() => {
            let children = document.querySelector('.login').children;
            
            for(let i = 0; i < children.length; i++){
                children[i].style.transition = '0s';
                children[i].style.opacity = 0;
                
                children[i].style.removeProperty('transition');
            }
            
            document.querySelector('.pass-change').style.display = 'block';
            document.querySelector('.pass-change').style.opacity = 1;
            document.querySelector('#welcomeback-text').innerText = 'Welcome back, ' + json.username;
        }, 150);
    } else {
        document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, 100%) rotateY(180deg)';
        document.querySelector('.login').style.opacity = 0;

        loadPanel();
    }
}

let resetPass = async () => {
    try{
        if(password1.value !== password2.value)
            return notify({ title: 'Error', body: 'Passwords Must Be The Same.' });

        document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, -50%) rotateY(180deg)';
        setTimeout(() => {
            let children = document.querySelector('.login').children;
            
            for(let i = 0; i < children.length; i++){
                if(children[i].className.includes('flip-side')){
                    children[i].style.transition = '0s';
                    children[i].style.opacity = 1;
                } else {
                    children[i].style.transition = '0s';
                    children[i].style.opacity = 0;
                }
            }
        }, 150);
        
        let hashedPass = CryptoJS.SHA256(password1.value).toString();
        
        let req = await fetch('/api/v1/auth/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                auth: session
            },
            body: JSON.stringify({
                password: hashedPass
            })
        })

        let data = await req.json();

        if(data.ok){
            document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, 100%) rotateY(180deg)';
            document.querySelector('.login').style.opacity = 0;

            loadPanel();

            setTimeout(() => {
                document.querySelector('.login').style.display = 'none';
            }, 500);
        } else{
            notify({ title: 'Error', body: data.error });

            setTimeout(() => {
                document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, -50%) rotateY(0deg)';
                setTimeout(() => {
                    let children = document.querySelector('.login').children;
                    
                    for(let i = 0; i < children.length; i++){
                        children[i].style.transition = '0s';
                        children[i].style.opacity = 0;
                        
                        children[i].style.removeProperty('transition');
                    }
                    
                    document.querySelector('.pass-change').style.display = 'block';
                    document.querySelector('.pass-change').style.opacity = 1;
                }, 150);
            }, 1000);
        }
    } catch(e){
        notify({ title: 'Error', body: e.toString() });

        setTimeout(() => {
            document.querySelector('.login').style.transform = 'perspective(500px) translate(-50%, -50%) rotateY(0deg)';
            setTimeout(() => {
                let children = document.querySelector('.login').children;
                
                for(let i = 0; i < children.length; i++){
                    children[i].style.transition = '0s';
                    children[i].style.opacity = 0;
                    
                    children[i].style.removeProperty('transition');
                }
                
                document.querySelector('.pass-change').style.display = 'block';
                document.querySelector('.pass-change').style.opacity = 1;
                document.querySelector('#welcomeback-text').innerText = 'Welcome back, ' + json.username;
            }, 150);
        }, 1000);
    }
}

let loadPanel = async () => {
    localStorage.setItem("session", session);

    let req = await fetch('/api/v1/user', {
        method: 'GET',
        headers: {
            auth: session
        }
    });

    let json = await req.json();

    if(!json.ok){
        document.querySelector('.login').setAttribute('style', '');

        notify({ title: 'Error', body: json.error });
        return;
    }

    let loader = document.querySelector('.panel-loading');
    loader.style.display = 'block';
    loader.style.opacity = 1;
    loader.innerHTML = 'Welcome back, ' + json.username+'.<br /><span style="font-size: 15px;">We are loading the page.</span>';

    setTimeout(() => {
        loader.style.opacity = 0;
        setTimeout(() => loader.style.display = 'none', 250);

        document.querySelector('.main').style.transform = 'translate(0, 0)';
    }, 1000);

    let rreq = await fetch('/api/v1/records', { headers: { auth: session } });
    let records = await rreq.json();

    if(records.ok === false)
        return notify({ title: 'Error', body: records.error });

    records.forEach(rec => {
        let record = document.createElement("div");
        record.className = "record";
        record.innerHTML = rec.type + 's://' + rec.domain + '/ >>> ' + rec.ip + ':' + rec.port + ' <span class="link">Edit</span>';

        record.onclick = () => {
            document.querySelector('.record-editor').querySelector('h2').innerHTML = rec.domain;
            document.querySelector('.record-editor').querySelector('p').innerHTML = 'Created by '+rec.userUsername;
            document.querySelector('#recordedit-ip').value = rec.ip;
            document.querySelector('#recordedit-port').value = rec.port;
            document.querySelector('.record-editor').style.display = 'block';

            currentRecord = rec;
            setTimeout(() => {
                document.querySelector('.record-editor').style.transform = 'translate(-50%, -50%)';
                document.querySelector('.record-editor').style.opacity = 1;
            }, 10);
        }

        document.querySelector('.records-body').appendChild(record);
    })
}

let newRecord = async () => {
    try{
        let domain = newRecDomain.value;
        let ip = newRecIP.value;
        let port = newRecPort.value;
        let type = newRecType.value;

        if(!domain || !ip || !port)
            return notify({ title: 'Error', body: 'Please fill in all fields.' });

        let req = await fetch('/api/v1/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                auth: session
            },
            body: JSON.stringify({
                record: { domain, ip, port, type }
            })
        });

        let data = await req.json();

        if(data.ok){
            newRecDomain.value = '';
            newRecIP.value = '';
            newRecPort.value = '';

            let rreq = await fetch('/api/v1/records', { headers: { auth: session } });
            let records = await rreq.json();

            if(records.ok === false)
                return notify({ title: 'Error', body: records.error });

            document.querySelector('.records-body').innerHTML = '';

            records.forEach(rec => {
                let record = document.createElement("div");
                record.className = "record";
                record.innerHTML = rec.type + 's://' + rec.domain + '/ >>> ' + rec.ip + ':' + rec.port + ' <span class="link">Edit</span>';

                record.onclick = () => {
                    document.querySelector('.record-editor').querySelector('h2').innerHTML = rec.domain;
                    document.querySelector('.record-editor').querySelector('p').innerHTML = 'Created by '+rec.userUsername;
                    document.querySelector('#recordedit-ip').value = rec.ip;
                    document.querySelector('#recordedit-port').value = rec.port;
                    document.querySelector('.record-editor').style.display = 'block';
                    
                    currentRecord = rec;
                    setTimeout(() => {
                        document.querySelector('.record-editor').style.transform = 'translate(-50%, -50%)';
                        document.querySelector('.record-editor').style.opacity = 1;
                    }, 10);
                }

                document.querySelector('.records-body').appendChild(record);
            })
        } else{
            notify({ title: 'Error', body: data.error });
        }
    } catch(e) {
        notify({ title: 'Error', body: e.toString() });
    }
}

let notify = ({ body, title }) => {
    if(currentNotif){
        currentNotif.style.opacity = '0';
        currentNotif.style.transform = 'translate(-100px, 0)';

        setTimeout(() => {
            currentNotif.remove()

            let notification = document.createElement("div");
            notification.className = "notification";

            let titleElement = document.createElement("h1");
            titleElement.innerText = title;

            let bodyElement = document.createElement("p");
            bodyElement.innerText = body;

            let progessElement = document.createElement("div");
            progessElement.className = "prog";

            let progressInner = document.createElement("div");
            progressInner.className = "prog-inner";

            progessElement.appendChild(progressInner);

            notification.appendChild(titleElement);
            notification.appendChild(bodyElement);
            notification.appendChild(progessElement);

            document.body.appendChild(notification);

            setTimeout(() => {
                progressInner.style.width = '0%';

                notification.style.opacity = '1';
                notification.style.transform = 'translate(0, 0)';
            }, 10);

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translate(-100px, 0)';

                setTimeout(() => notification.remove(), 250);
            }, 4750);
            currentNotif = notification;
        }, 250);
    } else{
        let notification = document.createElement("div");
        notification.className = "notification";

        let titleElement = document.createElement("h1");
        titleElement.innerText = title;

        let bodyElement = document.createElement("p");
        bodyElement.innerText = body;

        let progessElement = document.createElement("div");
        progessElement.className = "prog";

        let progressInner = document.createElement("div");
        progressInner.className = "prog-inner";

        progessElement.appendChild(progressInner);

        notification.appendChild(titleElement);
        notification.appendChild(bodyElement);
        notification.appendChild(progessElement);

        document.body.appendChild(notification);

        setTimeout(() => {
            progressInner.style.width = '0%';

            notification.style.opacity = '1';
            notification.style.transform = 'translate(0, 0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-100px, 0)';

            setTimeout(() => notification.remove(), 250);
        }, 4750);
        currentNotif = notification;
    }
}

if(session){
    document.querySelector('.login').style.display = 'none';
    loadPanel();
}

document.querySelector('#login-button').onclick = login;
document.querySelector('#reset-button').onclick = resetPass;
document.querySelector("#newrec-button").onclick = newRecord;

document.querySelector("#recordedit-cancel").onclick = () => {
    document.querySelector('.record-editor').style.transform = 'translate(-25%, -50%)';
    document.querySelector('.record-editor').style.opacity = 0;

    setTimeout(() => {
        document.querySelector('.record-editor').style.display = 'none';
    }, 250);
}

document.querySelector("#recordedit-save").onclick = () => {
    document.querySelector('.record-editor').style.transform = 'translate(-25%, -50%)';
    document.querySelector('.record-editor').style.opacity = 0;

    setTimeout(() => {
        document.querySelector('.record-editor').style.display = 'none';
    }, 250);

    let info = {
        ip: document.querySelector('#recordedit-ip').value,
        port: document.querySelector('#recordedit-port').value
    }

    fetch('/api/v1/records/' + currentRecord.id, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            auth: session
        },
        body: JSON.stringify(info)
    }).then(data => data.json()).then(async data => {
        if(data.ok){
            notify({ title: 'Success', body: 'Record successfully updated.' });
            
            let rreq = await fetch('/api/v1/records', { headers: { auth: session } });
            let records = await rreq.json();

            if(records.ok === false)
                return notify({ title: 'Error', body: records.error });

            document.querySelector('.records-body').innerHTML = '';

            records.forEach(rec => {
                let record = document.createElement("div");
                record.className = "record";
                record.innerHTML = rec.type + 's://' + rec.domain + '/ >>> ' + rec.ip + ':' + rec.port + ' <span class="link">Edit</span>';

                record.onclick = () => {
                    document.querySelector('.record-editor').querySelector('h2').innerHTML = rec.domain;
                    document.querySelector('.record-editor').querySelector('p').innerHTML = 'Created by '+rec.userUsername;
                    document.querySelector('#recordedit-ip').value = rec.ip;
                    document.querySelector('#recordedit-port').value = rec.port;
                    document.querySelector('.record-editor').style.display = 'block';
                    
                    currentRecord = rec;
                    setTimeout(() => {
                        document.querySelector('.record-editor').style.transform = 'translate(-50%, -50%)';
                        document.querySelector('.record-editor').style.opacity = 1;
                    }, 10);
                }

                document.querySelector('.records-body').appendChild(record);
            })
        } else
            notify({ title: 'Error', body: data.error });
    }).catch(e => {
        notify({ title: 'Error', body: e.toString() });
    })
}

document.querySelector("#recordedit-delete").onclick = () => {
    document.querySelector('.record-editor').style.transform = 'translate(-25%, -50%)';
    document.querySelector('.record-editor').style.opacity = 0;

    setTimeout(() => {
        document.querySelector('.record-editor').style.display = 'none';
    }, 250);

    fetch('/api/v1/records/' + currentRecord.id, {
        method: 'DELETE',
        headers: {
            auth: session
        }
    }).then(data => data.json()).then(async data => {
        if(data.ok){
            notify({ title: 'Success', body: 'Record deleted sucessfully.' });

            let rreq = await fetch('/api/v1/records', { headers: { auth: session } });
            let records = await rreq.json();

            if(records.ok === false)
                return notify({ title: 'Error', body: records.error });

            document.querySelector('.records-body').innerHTML = '';

            records.forEach(rec => {
                let record = document.createElement("div");
                record.className = "record";
                record.innerHTML = rec.type + 's://' + rec.domain + '/ >>> ' + rec.ip + ':' + rec.port + ' <span class="link">Edit</span>';

                record.onclick = () => {
                    document.querySelector('.record-editor').querySelector('h2').innerHTML = rec.domain;
                    document.querySelector('.record-editor').querySelector('p').innerHTML = 'Created by '+rec.userUsername;
                    document.querySelector('#recordedit-ip').value = rec.ip;
                    document.querySelector('#recordedit-port').value = rec.port;
                    document.querySelector('.record-editor').style.display = 'block';
                    
                    currentRecord = rec;
                    setTimeout(() => {
                        document.querySelector('.record-editor').style.transform = 'translate(-50%, -50%)';
                        document.querySelector('.record-editor').style.opacity = 1;
                    }, 10);
                }

                document.querySelector('.records-body').appendChild(record);
            })
        } else
            notify({ title: 'Error', body: data.error });
    }).catch(e => {
        notify({ title: 'Error', body: e.toString() });
    })
}