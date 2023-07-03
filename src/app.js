import express  from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from 'dotenv'

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

})

app.get('/participants', async (req, res) => {
    const participantsList = await db.collection('participants').find().toArray()
    return res.send(participantsList)
})

app.post('/messages', async (req, res) => {

})

app.get('/messages', async (req, res) => {
    
})

app.post('/status', async (req, res) => {

})

setInterval(async() => {
    console.log('15 segundos se passaram')
}, 15000)