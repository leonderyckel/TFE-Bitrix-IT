import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import WS_URL from '../config/ws';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const socketRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token available for socket connection');
      return;
    }

    if (!socketRef.current) {
      console.log('Initializing socket connection with token');
      const newSocket = io(WS_URL, {
        autoConnect: false,
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
      });

      // Add connection event listeners
      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsReady(true);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsReady(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        setIsReady(false);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsReady(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connect after setting up listeners
      newSocket.connect();
    }

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsReady(false);
      }
    };
  }, []); // Empty dependency array since we only want to set up once

  return (
    <SocketContext.Provider value={{ socket, isReady }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 