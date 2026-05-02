import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { socketAuth } from '../middleware/socketAuth.js';
import { stopAllCollectorsForSocket } from './metricsService.js';

/**
 * Socket.IO service — single instance, org-scoped rooms.
 *
 * Room naming convention:
 *   `org:${orgId}`  — all clients in the same organisation
 *   `team:${teamId}` — reserved for future team-scoped budget alerts (Sprint 3)
 *
 * Event contract (matches frontend useSocket hook):
 *   metrics:update      → { cpu, ram, disk, network, serverId, timestamp }
 *   cost:update         → { teamId, amount, period, delta, currency }
 *   alert:new           → { alertId, type, severity, message, resourceId }
 *   recommendation:new  → { type, title, estimatedSaving, resourceId }
 */

let io;

// ── Initialization ────────────────────────────────────────────────────────────

export const initSocket = (httpServer) => {
    if (io) {
        logger.warn('initSocket called twice — returning existing instance');
        return io;
    }

    io = new Server(httpServer, {
        cors: {
            origin: env.clientUrl,   // single origin — same rule as HTTP CORS
            methods: ['GET', 'POST'],
            credentials: true,        // required for httpOnly cookie transport
        },
        // Upgrade heartbeat interval for cleaner disconnection detection
        pingInterval: 25_000,
        pingTimeout:  20_000,
    });

    // ── Auth middleware ───────────────────────────────────────────────────────
    // socketAuth runs before every connection attempt.
    // It verifies the JWT, populates socket.data, and rejects invalid clients.
    io.use(socketAuth);

    // ── Connection handler ───────────────────────────────────────────────────
    io.on('connection', (socket) => {
        const { userId, orgId, teamId, role } = socket.data;
        const orgRoom  = `org:${orgId}`;
        const teamRoom = `team:${teamId}`;

        logger.info({ socketId: socket.id, userId, orgId, teamId, role }, 'Socket connected');

        // Every client joins their org room automatically — this is how
        // emitToOrg() reaches all users in the org (cross-team visibility).
        socket.join(orgRoom);

        // Also join team room for future team-scoped budget alert events
        socket.join(teamRoom);

        // ── Client-initiated metric streaming ─────────────────────────────
        // Client sends { serverId } to start receiving metrics:update events.
        // serverId is an arbitrary identifier (e.g. AWS instance ID or 'local').
        socket.on('metrics:start', ({ serverId } = {}) => {
            if (!serverId) {
                socket.emit('error', { code: 'MISSING_SERVER_ID', message: 'serverId is required' });
                return;
            }

            // Lazy import to avoid circular dependency during module init
            import('./metricsService.js').then(({ startMetricCollection }) => {
                startMetricCollection(orgId, teamId, serverId, socket.id);
                logger.info({ socketId: socket.id, orgId, serverId }, 'Metric collection started');
            });
        });

        socket.on('metrics:stop', ({ serverId } = {}) => {
            if (serverId) {
                import('./metricsService.js').then(({ stopMetricCollection }) => {
                    stopMetricCollection(serverId, socket.id);
                });
            }
        });

        // ── Disconnect ────────────────────────────────────────────────────
        socket.on('disconnect', (reason) => {
            logger.info({ socketId: socket.id, userId, orgId, reason }, 'Socket disconnected');
            // Clean up all metric collectors owned by this socket
            stopAllCollectorsForSocket(socket.id);
        });
    });

    logger.info('Socket.IO initialized — org-scoped rooms active');
    return io;
};

// ── Public emitters ───────────────────────────────────────────────────────────

/**
 * Emit an event to ALL connected clients in an organisation.
 * Used by: anomalyDetector, metricsService, budget alerts.
 */
export const emitToOrg = (orgId, event, data) => {
    if (!io) {
        logger.warn({ orgId, event }, 'emitToOrg called before Socket.IO initialized');
        return;
    }
    const room = `org:${orgId}`;
    io.to(room).emit(event, data);
    logger.debug({ orgId, event, room }, 'Socket event emitted to org');
};

/**
 * Emit to a specific team room.
 * Reserved for team-scoped budget alerts (Sprint 3 — budget threshold events).
 * NOT used for anomalies — those go to the full org room.
 */
export const emitToTeam = (teamId, event, data) => {
    if (!io) {
        logger.warn({ teamId, event }, 'emitToTeam called before Socket.IO initialized');
        return;
    }
    const room = `team:${teamId}`;
    io.to(room).emit(event, data);
    logger.debug({ teamId, event, room }, 'Socket event emitted to team');
};

/**
 * Returns the raw Socket.IO server instance.
 * Prefer emitToOrg/emitToTeam — use getIO only for admin tooling.
 */
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initSocket(httpServer) first.');
    }
    return io;
};
