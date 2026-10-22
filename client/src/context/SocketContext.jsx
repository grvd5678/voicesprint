import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveNotification, setLiveNotification] = useState(null);

  useEffect(() => {
    // Connect to backend via proxy or explicit localhost
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket.io Client] Connected with ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 [Socket.io Client] Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('VOICE_INTAKE_SUCCESS', (payload) => {
      console.log('🎙️ [Voice Intake Broadcast Received]:', payload);
      setLiveNotification({
        id: Date.now(),
        title: payload.title,
        priority: payload.priority,
        assignee: payload.assignee,
        aiPowered: payload.aiPowered,
      });

      // Auto-clear toast after 5 seconds
      setTimeout(() => {
        setLiveNotification((prev) => (prev?.id === payload.id ? null : prev));
      }, 5000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, liveNotification, clearNotification: () => setLiveNotification(null) }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

