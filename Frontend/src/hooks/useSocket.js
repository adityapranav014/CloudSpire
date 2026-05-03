import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated, selectOrgId } from '../store/slices/authSlice';
import { setSocketConnected, addNewAlert } from '../store/slices/alertsSlice';
import { updateServerMetrics, accumulateCost } from '../store/slices/metricsSlice';


/**
 * useSocket — manages the Socket.IO connection lifecycle.
 *
 * Cookie-based auth (Task 2):
 *   The httpOnly cookie is sent automatically by the browser on the Socket.IO
 *   HTTP handshake (it's a standard HTTP upgrade request). We do NOT pass
 *   auth: { token } — the cookie IS the credential.
 *
 *   The server's socketAuth middleware reads the cookie from the handshake
 *   headers and verifies the JWT, same as the HTTP protect middleware.
 *
 * Usage:
 *   Call useSocket() once in a top-level authenticated layout component.
 *   Use the returned { startMetrics, stopMetrics } to control metric streaming.
 *
 * The hook connects when the user is authenticated and disconnects on logout.
 * Re-connection is handled automatically by Socket.IO with exponential backoff.
 */
export function useSocket() {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const orgId           = useSelector(selectOrgId);
    const dispatch        = useDispatch();
    const socketRef       = useRef(null);

    useEffect(() => {
        // Only connect when we have a verified session
        if (!isAuthenticated || !orgId) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                dispatch(setSocketConnected(false));
            }
            return;
        }

        // Prevent duplicate connections (React Strict Mode double-invoke)
        if (socketRef.current?.connected) return;

        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
            || import.meta.env.VITE_API_URL?.replace('/api/v1', '')
            || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://cloudspire.onrender.com');

        const socket = io(SOCKET_URL, {
            // withCredentials: true causes the browser to send the httpOnly cookie
            // on the HTTP upgrade handshake. This is how socketAuth reads it.
            withCredentials: true,

            // Do NOT pass auth.token — the cookie is the credential
            // auth: { token } intentionally omitted

            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay:    1_000,
            reconnectionDelayMax: 30_000,
        });

        socketRef.current = socket;

        // ── Connection events ─────────────────────────────────────────────
        socket.on('connect', () => {
            console.info(`[Socket] Connected → id: ${socket.id}, org: ${orgId}`);
            dispatch(setSocketConnected(true));
        });

        socket.on('disconnect', (reason) => {
            console.info(`[Socket] Disconnected: ${reason}`);
            dispatch(setSocketConnected(false));
        });

        socket.on('connect_error', (err) => {
            // err.message will be AUTH_REQUIRED, TOKEN_EXPIRED, etc.
            console.warn(`[Socket] Connection error: ${err.message}`);
            dispatch(setSocketConnected(false));

            // Non-retryable auth errors — stop reconnection attempts
            const authErrors = ['AUTH_REQUIRED', 'TOKEN_EXPIRED', 'INVALID_TOKEN', 'NO_ORG_SCOPE'];
            if (authErrors.includes(err.message)) {
                socket.disconnect();
            }
        });

        // ── Data events ───────────────────────────────────────────────────

        // alert:new — fired by anomalyDetector when a cost spike is detected
        socket.on('alert:new', (alert) => {
            dispatch(addNewAlert(alert));
            // Toast notifications are handled by the ToastContext subscriber
            // that watches the alerts Redux state — not inline here to keep
            // this hook decoupled from UI concerns.
        });

        // metrics:update — fired by metricsService every 3 seconds
        socket.on('metrics:update', ({ serverId, cpu, ram, disk, network, timestamp }) => {
            dispatch(updateServerMetrics({ serverId, cpu, ram, disk, network, timestamp }));
        });

        // cost:update — estimated cost delta from metricsService
        socket.on('cost:update', ({ amount, currency, timestamp }) => {
            dispatch(accumulateCost({ amount, currency, timestamp }));
        });

        // recommendation:new — future event from AI recommendation engine (Task 8)
        socket.on('recommendation:new', (rec) => {
            console.info('[Socket] New recommendation received:', rec.title);
            // TODO: dispatch to optimizationsSlice when created in Sprint 2
        });

        // ── Cleanup ───────────────────────────────────────────────────────
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('alert:new');
            socket.off('metrics:update');
            socket.off('cost:update');
            socket.off('recommendation:new');
            socket.disconnect();
            socketRef.current = null;
            dispatch(setSocketConnected(false));
        };
    }, [isAuthenticated, orgId, dispatch]);

    // ── Metric streaming controls ─────────────────────────────────────────────

    /**
     * startMetrics(serverId)
     * Signals the server to start emitting metrics:update for this server.
     * Typically called when the Live Metrics panel mounts.
     */
    const startMetrics = useCallback((serverId) => {
        if (!socketRef.current?.connected) {
            console.warn('[Socket] startMetrics called but socket is not connected');
            return;
        }
        socketRef.current.emit('metrics:start', { serverId });
    }, []);

    /**
     * stopMetrics(serverId)
     * Signals the server to stop emitting metrics:update for this server.
     */
    const stopMetrics = useCallback((serverId) => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit('metrics:stop', { serverId });
    }, []);

    return { socket: socketRef.current, startMetrics, stopMetrics };
}
