import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { selectToken } from '../store/slices/authSlice';
import { setSocketConnected, addNewAlert } from '../store/slices/alertsSlice';
import { useToast } from '../context/ToastContext';

export function useSocket() {
  const token = useSelector(selectToken);
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        dispatch(setSocketConnected(false));
      }
      return;
    }

    // Initialize Socket.io client
    const socket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'], // Prefer websocket
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to real-time socket');
      dispatch(setSocketConnected(true));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from real-time socket');
      dispatch(setSocketConnected(false));
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      dispatch(setSocketConnected(false));
    });

    // Listeners for backend events
    socket.on('alert:new', (newAlert) => {
      dispatch(addNewAlert(newAlert));
      
      // Show toast notification
      addToast(
        `New Alert: ${newAlert.title} - Spend surged to $${newAlert.actualSpend.toFixed(2)}`,
        newAlert.severity === 'critical' ? 'error' : 'info'
      );
    });

    // Cleanup on unmount or token change
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('alert:new');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, dispatch, addToast]);

  return socketRef.current;
}
