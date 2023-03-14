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
        dataToSend = buffer.toString('latin1');
    });

    python.on('close', (code) => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lunsj</title>
                <meta charset="UTF-8" />
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
                <style>
                    .app {
                        display: flex;
                        flex-direction: column;
                        max-width: 400px;
                        margin: auto;
                        padding: 1em;
                        border: 1px solid #dfdfdf;
                        border-radius: 20px;
                        background: #fff;
                    }

                    body {
                        background: url(/burger.jpg);
                        background-size: cover;
                        font-family: 'Bebas Neue', cursive;
                    }
                </style>
            </head>

            <body>
                <div class="app">
                    <h1>Meny</h1>

                    <div style="display: flex; gap: .5em;">
                        <a href="/dag/mandag">Mandag</a>
                        <a href="/dag/tirsdag">Tirsdag</a>
                        <a href="/dag/onsdag">Onsdag</a>
                        <a href="/dag/torsdag">Torsdag</a>
                        <a href="/dag/fredag">Fredag</a>
                    </div>

                    <div>
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

app.listen(port, () => console.log(`LunsjApp kjører på port: ${port}!`))
