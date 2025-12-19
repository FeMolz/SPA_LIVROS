import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDb } from './config/db.js';
import bookRoutes from './routes/bookRoutes.js'

dotenv.config();

const app = express();  
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use('/books', bookRoutes)

const startServer = async () => {
    await connectDb();

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
};

startServer();
