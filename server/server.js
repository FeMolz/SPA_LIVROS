import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { connectDb } from './config/db.js';
import bookRoutes from './routes/bookRoutes.js'
import friendRoutes from './routes/friendRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

import authRoutes from './routes/authRoutes.js';
import verifyToken from './middleware/authMiddleware.js';

app.use(express.json());
app.use(cors());

app.use('/api/user', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/books', verifyToken, bookRoutes);

app.use(express.static(path.join(__dirname, '../client')));

app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const startServer = async () => {
    await connectDb();

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
};

startServer();