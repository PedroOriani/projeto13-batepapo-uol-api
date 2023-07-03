import express  from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from 'dotenv';
import Joi from "joi";

dotenv.config()
const app = express();

app.use(cors());
app.use(express.json())

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;

mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor esta rodando na porta ${PORT}`));

app.post('/participants', async (req, res) => {
    const { name } = req.body;

    const schemaName = Joi.object({name: Joi.string().required()})

    const validation = schemaName.validate(req.body, {abortEarly: false})
    if (validation.error){
        const errors = validation.error.details.map(detail => detail.message)
        res.status(422).send(errors)
        return
    }

    try{
        const participant = await db.collection('participants').findOne({name: name})

        if (!participant){
            await db.collection('participants').insertOne({name: name, lastStatus: Date.now()});

            const message ={
                from: name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: dayjs().format('HH:mm:ss')
            }
            await db.collection('messages').insertOne(message)

            res.sendStatus(201)
        }else{
            res.status(409).send('Usuário ja cadastrado');
        }
    }catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/participants', async (req, res) => {
    const participantsList = await db.collection('participants').find().toArray()
    return res.send(participantsList)
})

app.post('/messages', async (req, res) => {
    const { to, text, type } = req.body;
    const from = req.headers.user;

    const participant = await db.collection('participants').findOne({name: from})

    const schemaName = Joi.object({
        to: Joi.string().required(),
        text: Joi.string().required(),
        type: Joi.string().required()
    })

    const validation = schemaName.validate(req.body, {abortEarly: false})
    if (validation.error || !participant){
        const errors = validation.error.details.map(detail => detail.message);
        res.status(422).send(errors);
        return;
    }

    if(type !== 'message' || type !== 'private_message'){
        res.sendStatus(422);
        return;
    }

    const message ={
        from: from,
        to: to,
        text: text,
        type: type,
        time: dayjs().format('HH:mm:ss')
    };

    try{
        await db.collection('messages').insertOne(message);
        res.sendStatus(201)
    }catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/messages', async (req, res) => {
    
})

app.post('/status', async (req, res) => {

})

setInterval(async() => {
    console.log('15 segundos se passaram')
}, 15000)