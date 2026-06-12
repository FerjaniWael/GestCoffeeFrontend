'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    // Connect to Socket.IO if user is logged in or if it's a customer accessing the menu
    // Customers won't have a token, but they need socket connection to get menu updates or send orders.
    // We can check if we are on the client side.
    if (typeof window === 'undefined') return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    
    // Create new socket connection
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
      
      // If we have a logged-in user, join their respective rooms
      if (user) {
        if (user.role === 'admin') {
          newSocket.emit('join-admin');
        } else if (user.role === 'waiter') {
          newSocket.emit('join-waiter', user.id);
        } else if (user.role === 'head_chef' || user.role === 'pastry_chef') {
          newSocket.emit('join-chef', user.role);
        }
        
        // Also join user-specific notification room
        newSocket.emit('join-room', `user-${user.id}`);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    // Cleanup on unmount or authentication change
    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
