import express  from "express";
import { MongoClient, ObjectId } from "mongodb";
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
    const { user } = req.headers;

    try{
        const participant = await db.collection('participants').findOne({name: user})
        if(!participant){
            res.sendStatus(422);
            return
        }
        
        const schemaMessage = Joi.object({
            to: Joi.string().required(),
            text: Joi.string().required(),
            type: Joi.string().valid("message", "private_message").required()
        })

        const validation = schemaMessage.validate(req.body, {abortEarly: false})
        if (validation.error){
            const errors = validation.error.details.map(detail => detail.message);
            res.status(422).send(errors);
            return
        }else{    

        const message ={
            from: user,
            to: to,
            text: text,
            type: type,
            time: dayjs().format('HH:mm:ss')
        };
            await db.collection('messages').insertOne(message);
            return res.sendStatus(201)
        }
    }catch (err) {
        return res.status(500).send(err.message)
    }
})

app.get('/messages', async (req, res) => {
    const { user } = req.headers;
    const { limit } = req.query;

    const messages = await db.collection('messages').find({
        $or: [
            { from: user },
            { to:  user},
            { to: "Todos"}
        ]
    }).toArray();

    if (limit){

        const schemaLimit = Joi.number().min(1);
        const { error } = schemaLimit.validate(limit);

        if (error){
            res.status(422).send(error.message);
            return
        }

        res.send(messages.slice(-limit))
        return
    }

    res.send(messages);
})

app.post('/status', async (req, res) => {
    const user = Buffer.from(req.headers.user, 'latin1').toString('latin1')

    try{
        const participant = await db.collection('participants').findOne({name: user});

        if(!user || !participant){
            return res.sendStatus(404);
        }else{
            await db.collection('participants').updateOne({id: new ObjectId(participant.id)}, {lastStatus: {$set:Date.now()}})
            return res.sendStatus(200);
        }
    }catch (err){
        return res.status(500).send(err.message)
    }  
})

setInterval(async() => {
    try{
        const participants = await db.collection('participants').find({lastStatus: {$lt: Date.now() - 10000}}).toArray()

        participants.forEach(async p => {
            const message = {
                from: p.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs().format('HH:mm:ss')
            }

            db.collection('participants').deleteOne({_id: new ObjectId(p.id)});
            db.collection('messages').insertOne(message);
        });
    }catch (err) {
        return res.status(500).send(err.message);
    }
}, 15000)