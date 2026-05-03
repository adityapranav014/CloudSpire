import app from './app.js';
import http from 'http';
import { env } from './config/env.js';
import { connectToDatabase } from './config/database.js';
import { initSocket } from './services/socketService.js';

const PORT = env.port || 4000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

connectToDatabase(env.mongoUri)
    .then(() => {
        console.log('MongoDB connected');
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
