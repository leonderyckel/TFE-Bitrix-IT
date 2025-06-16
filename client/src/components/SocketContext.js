import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import WS_URL from '../config/ws';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const { token, isAuthenticated, loading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log('[SocketProvider] Auth state changed:', { 
      hasToken: !!token, 
      isAuthenticated, 
      loading, 
      hasUser: !!user 
    });

    // Clean up existing socket if any
    if (socket) {
      console.log('[SocketProvider] Cleaning up existing socket');
      socket.disconnect();
      setSocket(null);
      setIsReady(false);
    }

    // Only connect if we have a token and are authenticated
    // Also wait for loading to complete to ensure user data is loaded
    if (token && isAuthenticated && !loading && user) {
      console.log('[SocketProvider] Initializing socket connection...');
      
      const newSocket = io(WS_URL, {
        auth: {
          token: token
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('[SocketProvider] Connected to server with ID:', newSocket.id);
        
        // Join user's personal room automatically
        if (user && user.id) {
          const userRoom = `user_${user.id}`;
          console.log('[SocketProvider] Joining user room:', userRoom);
          newSocket.emit('join-user-room', userRoom);
        }
        
        setIsReady(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[SocketProvider] Disconnected from server:', reason);
        setIsReady(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('[SocketProvider] Connection error:', error);
        setIsReady(false);
      });

      newSocket.on('error', (error) => {
        console.error('[SocketProvider] Socket error:', error);
      });

      // Handle authentication errors
      newSocket.on('auth_error', (error) => {
        console.error('[SocketProvider] Authentication error:', error);
        setIsReady(false);
      });

      setSocket(newSocket);

      return () => {
        console.log('[SocketProvider] Cleaning up socket in useEffect cleanup');
        newSocket.disconnect();
      };
    } else {
      console.log('[SocketProvider] Not connecting socket - conditions not met:', {
        hasToken: !!token,
        isAuthenticated,
        loading,
        hasUser: !!user
      });
      setIsReady(false);
    }
  }, [token, isAuthenticated, loading, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        console.log('[SocketProvider] Component unmounting, disconnecting socket');
        socket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isReady }}>
      {children}
    </SocketContext.Provider>
  );
}; 