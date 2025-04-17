import express from 'express';
import { spawn } from 'child_process';

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
    },
    {
        name: "monday",
        number: "0"
    },
    {
        name: "tuesday",
        number: "1"
    },
    {
        name: "wednesday",
        number: "2"
    },
    {
        name: "thursday",
        number: "3"
    },
    {
        name: "friday",
        number: "4"
    }
];

function getPage(req, res, day, language) {
    console.log('getPage: ', day, language);

    let dataToSend;
    let pythonScript;

    // Determine the Python script based on the selected language and route
    if (req.path === '/' || req.path === '/en') {
        pythonScript = 'lunsj_dagens.py';
    } else if (req.path === '/with-allergies') {
        pythonScript = 'lunsj_dagens.py';
    } else {
        pythonScript = 'lunsj.py';
    }

    const python = spawn('python3', [pythonScript, day, language]);

    res.set({ 'content-type': 'text/html; charset=utf-8' });

    python.stdout.on('data', function (data) {
        const buffer = Buffer.from(data);
        dataToSend = buffer.toString('utf-8');
    });

    python.on('close', (code) => {
        let buttonsHtml = '';
        if (language === 'en') {
            // English buttons
            buttonsHtml = `
                <div class="button-group">
                <a href="/en">Todays lunch</a>
                </div>
                <div class="button-group">
                <a href="/en/day/monday">Monday</a>
                <a href="/en/day/tuesday">Tuesday</a>
                <a href="/en/day/wednesday">Wednesday</a>
                <a href="/en/day/thursday">Thursday</a>
                <a href="/en/day/friday">Friday</a>
                </div>
            `;
        } else {
            // Norwegian buttons (default)
            buttonsHtml = `
                <div class="button-group">
                <a href="/">Dagens lunsj</a>
                </div>
                <div class="button-group">
                <a href="/dag/mandag">Mandag</a>
                <a href="/dag/tirsdag">Tirsdag</a>
                <a href="/dag/onsdag">Onsdag</a>
                <a href="/dag/torsdag">Torsdag</a>
                <a href="/dag/fredag">Fredag</a>
                </div>
            `;
        }
        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <link rel="manifest" href="/manifest.json">

            <!-- Google tag (gtag.js) -->
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZB3ZXQX08B"></script>
            <script>
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-ZB3ZXQX08B');
            </script>
            <title>Lunsjmeny Fornebu</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">

            <link rel="icon" type="image/png" href="public/apple-touch-icon.png" sizes="152x152">
            <link rel="icon" type="image/png" href="/android-chrome-192x192.png" sizes="192x192">
            <link rel="icon" href="/favicon.ico" type="image/x-icon">

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
                  vertical-align: middle;
                  display: grid;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  min-width: 100px;
                }
                .buttons {
                    font-size: 1.4vw;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 0.01em;
                }
                .buttons a {
                    padding: 0em 0.4em; /* Default padding value */
                }

                .button-group {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 0.5rem; /* Adjust as needed */
                }

                .button-group a {
                    margin: 0 0.5rem; /* Adjust as needed */
                }

                @media (max-width: 429px) {
                    .buttons a {
                        padding: 0em 0.2em; /* Adjust padding for screens up to 420px wide */
                    }
                }

                @media (max-width: 410px) {
                    .buttons a {
                        padding: 0em 0.1em; /* Adjust padding for screens up to 410px wide */
                    }
                }
                }
                .buttons a.active {
                    background-color: #dfdfdf;
                }
                @media(min-width: 280px) {
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
                    <h1 style="font-size: 1.7em;">${language === 'en' ? 'LUNCH MENU FORNEBU' : 'LUNSJMENY FORNEBU'}</h1>

                    <div class="buttons" style="font-size: 1em">
                        ${buttonsHtml}
                    </div>

                    <div class="content">
                        <p style="white-space: break-spaces;">${dataToSend}</p>
                    </div>
                    <div class="buttons" style="gap: .1em;">
                      <a href="/" style="font-size: 0.8em;">Nor</a>
                      <a href="/en" style="font-size: 0.8em;">Eng</a>
                    </div>

                    <!-- Ny knapp på egen linje -->
                    <div class="buttons" style="gap: .1em; margin-top: 0.5em;">
                      <a href="/with-allergies" style="font-size: 0.8em;">
                        ${language === 'en' ? 'With Allergies' : 'Med allergier'}
                      </a>
                    </div>
                </div>
            </body>
        </html>
        `);
    });
}

app.get('/', (req, res) => {
    getPage(req, res, -1, 'no'); // Default to Norwegian language
});

app.get('/en', (req, res) => {
    getPage(req, res, -1, 'en');
});

app.get('/with-allergies', (req, res) => {
    getPage(req, res, -1, 'al');
});

app.get('/om', (req, res) => {
    getPage(req, res, -2, 'no'); // Default to Norwegian language
});

app.get('/dag/:day', (req, res) => {
    const params = req.params;
    const day = days.find(x => x.name == params["day"]);
    getPage(req, res, day ? day.number : days[0].number, 'no'); // Default to Norwegian language
});

app.get('/en/day/:day', (req, res) => {
    const params = req.params;
    const day = days.find(x => x.name == params["day"]);
    getPage(req, res, day ? day.number : days[0].number, 'en');
});

app.get('/admin', (req, res) => {
    let dataToSend;
    const python = spawn('python3', ['lunsj_admin.py']);
    res.set({ 'content-type': 'text/plain; charset=utf-8' });

    python.stdout.on('data', function (data) {
        const buffer = Buffer.from(data);

        dataToSend = buffer.toString('utf-8');
    });

    python.on('close', (code) => {
        res.send(`${dataToSend}`);
    });
});

app.get('/webex', (req, res) => {
    let dataToSend;
    const python = spawn('python3', ['lunsj_webex.py', -1, 'no']); // Provide valid arguments for day and language
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
    const python = spawn('python3', ['lunsj_test.py']);
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
