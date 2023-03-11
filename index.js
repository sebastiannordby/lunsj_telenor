import express from 'express';
import {spawn} from 'child_process';

const app = express()
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    let dataToSend;
    const python = spawn('python', ['lunsj.py'], );
    res.set({ 'content-type': 'text/plain; charset=utf-8' });

    python.stdout.on('data', function (data) {
        const buffer = Buffer.from(data);

        dataToSend = buffer.toString('latin1');
    });

    python.on('close', (code) => {
        res.send(`${dataToSend}`);
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))