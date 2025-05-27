import React, { createContext, useContext, useRef } from 'react';
import io from 'socket.io-client';
import WS_URL from '../config/ws';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef();
  if (!socketRef.current) {
    socketRef.current = io(WS_URL, { autoConnect: true });
  }
  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 