import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dayjs from 'dayjs';
import { stripHtml } from "string-strip-html";

const app = express();
app.use(express.json());
app.use(cors());

let participants = [];
let messages = [];

if (fs.existsSync("./participants.txt")) {
    participants = JSON.parse(fs.readFileSync("./participants.txt"));
}

if (fs.existsSync("./messages.txt")) {
    messages = JSON.parse(fs.readFileSync("./messages.txt"));
}

app.post("/participants", (req, res) => {
    const { name } = req.body;
    if (name === '') {
        res.sendStatus(400);
    } else if (participants.filter(e => e.name === name).length > 0) {
        res.sendStatus(401);
    } else {
        participants.push({ name: stripHtml(name).result.trim(), lastStatus: Date.now() });
        messages.push({ 
                        from: stripHtml(name).result.trim(), 
                        to: 'Todos', 
                        text: 'entra na sala...', 
                        type: 'status',
                        time: dayjs().format('HH:mm:ss')
                    });
        fs.writeFileSync("./participants.txt", JSON.stringify(participants));
        fs.writeFileSync("./messages.txt", JSON.stringify(messages));
        res.sendStatus(200);
    };
});

app.get("/participants", (req, res) => {
    res.send(participants);
})

app.post("/messages", (req, res) => {
    const { to, text, type } = req.body;
    const time = dayjs().format('HH:mm:ss');
    const from = req.header('User');
    const message = {
        from: stripHtml(from).result.trim(),
        to: stripHtml(to).result.trim(),
        text: stripHtml(text).result.trim(),
        type: stripHtml(type).result.trim(),
        time
    };
    
    if ((to === '' || text === '') 
    || (type !== 'message' && type !== 'private_message') 
    || participants.filter(e => e.name === from).length === 0) {
        res.sendStatus(400);
    } else {
        messages.push(message);
        fs.writeFileSync("./messages.txt", JSON.stringify(messages));
        res.sendStatus(200);
    }
});

app.get("/messages", (req, res) => {
    const limit = req.query.limit;
    const user = req.header('User');
    const userMessages = messages.filter(e => {if (e.from === user 
                                                || e.to === user 
                                                || e.to === "Todos" 
                                                || e.type === "message") {
                                                    return true;
                                                } else {
                                                    return false;
                                                }
                                        }); 
    if (limit !== undefined) {
        userMessages.reverse();
        userMessages.splice(limit);
        userMessages.reverse();
        res.send(userMessages);
    } else {
        res.send(userMessages);
    }
})

app.post("/status", (req, res) => {
    const user = req.header('User');
    const index = participants.findIndex(e => e.name === user);
    if (index === -1) {
        res.sendStatus(400);
    } else {
        participants[index].lastStatus = Date.now();
        fs.writeFileSync("./participants.txt", JSON.stringify(participants));
        res.sendStatus(200);
    }
});

setInterval(() => {
    participants.forEach(e => {
        if ((Date.now() - e.lastStatus) > 10000) {
            messages.push({ 
                from: e.name, 
                to: "Todos", 
                text: "sai da sala...", 
                type: "status", 
                time: dayjs().format("HH:mm:ss")
            });
        }
    })
    participants = participants.filter(e => (Date.now() - e.lastStatus) < 10000);
    fs.writeFileSync("./participants.txt", JSON.stringify(participants));
}, 15000);

app.listen(4000, () => {
    console.log("On business baby");
})