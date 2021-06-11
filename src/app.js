import express from 'express';
import cors from 'cors';
//import fs from 'fs';
import dayjs from 'dayjs';

const app = express();
app.use(express.json());
app.use(cors());

const participants = [];
const messages = [];

app.post("/participants", (req, res) => {
    const { name } = req.body;
    if (name === '') {
        res.sendStatus(400);
    } else if (participants.filter(e => e.name === name).length > 0) {
        res.sendStatus(401);
    } else {
        participants.push({ name, lastStatus: Date.now() });
        messages.push({ 
                        from: name, 
                        to: 'Todos', 
                        text: 'entra na sala...', 
                        type: 'status',
                        time: dayjs().format('HH:mm:ss')
                    });
        res.sendStatus(200);
    };
});

app.get("/participants", (req, res) => {
    res.send(participants);
})

app.post("/messages", (req, res) => {
    const { to, text, type } = req.body;
    const time = dayjs().format('HH:mm:ss');
    const from = req.headers.get('User');
    const message = {
        from,
        to,
        text,
        type,
        time
    };
    
    if ((to === '' || text === '') || (type !== 'message' && type !== 'private_message') || !participants.reduce((acc,e) => e.from === from ? acc = true : null, false)) {
        res.sendStatus(400);
    } else {
        messages.push(message);
        res.sendStatus(200);
    }
});

app.listen(4000, () => {
    console.log("On business baby");
})