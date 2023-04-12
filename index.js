import express from 'express';
import {spawn} from 'child_process';

const app = express();
app.use(express.static('public'));
const port = process.env.PORT || 3000;
const days = [
    {
        name: "dagens",
        number: "-1"
    },
    {
        name: "mandag",
        number: "0"
    },
    {
        name: "tirsdag",
        number: "1"
    },
    {
        name: "onsdag",
        number: "2"
    },
    {
        name: "torsdag",
        number: "3"
    },
    {
        name: "fredag",
        number: "4"
    }
];

function getPage(req, res, day) {
    console.log('getPage: ', day);

    let dataToSend;
    const python = spawn('python', ['lunsj.py', day]);
    res.set({ 'content-type': 'text/html; charset=utf-8' });

    python.stdout.on('data', function (data) {
        const buffer = Buffer.from(data);
        dataToSend = buffer.toString('utf-8');
    });

    python.on('close', (code) => {
        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Lunsjmeny Fornebu</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
            <style>
                *, *:after {
                    box-sizing: border-box;
                }
                .app {
                    display: flex;
                    flex-direction: column;
                    max-width: 450px;
                    min-width: 200px;
                    margin: 0.5rem;
                    padding: 1em;
                    border: 2px solid #dfdfdf;
                    border-radius: 15px;
                    background: #fff;
                    overflow: inherit;
                    max-height: 100%;
                    width: auto;
                }
                .content {
                    flex: 1;
                    overflow: auto;
                }
                html, body {
                    height: 100vh;
                    width: 100vw;
                }
                body {
                  background: url(/mat.jpg);
                  background-size: cover;
                  background-position: center center;
                  background-repeat: no-repeat;
                  background-attachment: fixed;
                  font-family: 'Verdana,Geneva,sans-serif';
                  font-weight: bold;
                  font-size: 2vw;
                  vertical-align: middle;
                  display: grid;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  min-width: 100px;
                }
                .buttons {
                    font-size: 1.5vw;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 0.15em;
                }
                .buttons a {
                    padding: 0em .4em;
                }
                .buttons a.active {
                    background-color: #dfdfdf;
                }
                @media(min-width: 300px) {
                    .buttons {
                        font-size: 1.1rem;
                        justify-content: center;
                        margin-top: 0;
                    }
                    .buttons {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 0.15em;
                    }
                    .content {
                        margin-left: 0em;
                    }
                }
            </style>
        </head>

        <body>
            <div class="app">
                <h1>LUNSJMENY FORNEBU</h1>

                <div class="buttons" style="gap: .1em;">
                    <a href="/dag/mandag">Mandag</a>
                    <a href="/dag/tirsdag">Tirsdag</a>
                    <a href="/dag/onsdag">Onsdag</a>
                    <a href="/dag/torsdag">Torsdag</a>
                    <a href="/dag/fredag">Fredag</a>
                </div>

                <div class="content">
                    <p style="white-space: break-spaces;">${dataToSend}</p>
                </div>
            </div>
        </body>
        </html>
        `);
    });
}

app.get('/', (req, res) => {
    getPage(req, res, -1);
});

app.get('/dag/:day', (req, res) => {
    const params = req.params;
    const day = days.find(x => x.name == params["day"]);

    getPage(req, res, day ? day.number : days[0].number);
});

app.get('/webex', (req, res) => {
    let dataToSend;
    const python = spawn('python', ['lunsj_webex.py', -1]);
    res.set({ 'content-type': 'text/plain; charset=utf-8' });

    python.stdout.on('data', function (data) {
        const buffer = Buffer.from(data);

        dataToSend = buffer.toString('utf-8');
    });

    python.on('close', (code) => {
        res.send(`${dataToSend}`);
    });
});

app.get('/teams', (req, res) => {
    let dataToSend;
    const python = spawn('python', ['lunsj_teams.py', -1]);
    res.set({ 'content-type': 'text/plain; charset=utf-8' });

    python.stdout.on('data', function (data) {
        const buffer = Buffer.from(data);

        dataToSend = buffer.toString('utf-8');
    });

    python.on('close', (code) => {
        res.send(`${dataToSend}`);
    });
});

app.get('/test', (req, res) => {
    let dataToSend;
    const python = spawn('python', ['lunsj_test.py', -1]);
    res.set({ 'content-type': 'text/plain; charset=utf-8' });

    python.stdout.on('data', function (data) {
        const buffer = Buffer.from(data);

        dataToSend = buffer.toString('utf-8');
    });

    python.on('close', (code) => {
        res.send(`${dataToSend}`);
    });
});

app.get('/test/mandag', (req, res) => {
    let dataToSend;
    const python = spawn('python', ['lunsj_test.py', 0]);
    res.set({ 'content-type': 'text/plain; charset=utf-8' });

    python.stdout.on('data', function (data) {
        const buffer = Buffer.from(data);

        dataToSend = buffer.toString('utf-8');
    });

    python.on('close', (code) => {
        res.send(`${dataToSend}`);
    });
});

app.listen(port, () => console.log(`LunsjApp kjører på port: ${port}!`))
