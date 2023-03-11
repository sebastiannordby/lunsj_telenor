import express from 'express';
import {spawn} from 'child_process';

const app = express()
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
 
 let dataToSend;
 const python = spawn('python', ['lunsj.py']);
 
 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
 });

 python.on('close', (code) => {
    res.send(dataToSend);
 });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))