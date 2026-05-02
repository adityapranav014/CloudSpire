import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import User from '../models/User.js';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Frontend URLs
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }

            const decoded = jwt.verify(token, env.jwtSecret);
            const user = await User.findById(decoded.id).select('teamId role');
            
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const teamId = socket.user.teamId.toString();
        
        logger.info({ socketId: socket.id, teamId }, 'Client connected to socket');
        
        // Join the team room automatically
        socket.join(teamId);

        socket.on('disconnect', () => {
            logger.info({ socketId: socket.id, teamId }, 'Client disconnected from socket');
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

/**
 * Emits an event to all connected clients within a specific team.
 */
export const emitToTeam = (teamId, event, data) => {
    if (io) {
        io.to(teamId.toString()).emit(event, data);
        logger.info({ teamId, event }, 'Socket event emitted to team');
    }
};
