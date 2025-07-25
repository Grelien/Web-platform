import { useState, useEffect, useRef, useCallback } from 'react';
import type { SSEMessage } from '../types';

interface UseSSEConnectionOptions {
  onMessage: (message: SSEMessage) => void;
  onConnectionChange: (connected: boolean) => void;
  reconnectInterval?: number;
}

interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

export function useSSEConnection({ 
  onMessage, 
  onConnectionChange, 
  reconnectInterval = 5000 
}: UseSSEConnectionOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false,
    error: null
  });
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isManuallyClosedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const updateConnectionStatus = useCallback((status: Partial<ConnectionStatus>) => {
    setConnectionStatus(prev => {
      const newStatus = { ...prev, ...status };
      if (prev.connected !== newStatus.connected) {
        onConnectionChange(newStatus.connected);
      }
      return newStatus;
    });
  }, [onConnectionChange]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Check if we've exceeded max reconnect attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnect attempts reached. Stopping reconnection.');
      updateConnectionStatus({ 
        connected: false, 
        reconnecting: false, 
        error: 'Max reconnect attempts reached' 
      });
      return;
    }

    updateConnectionStatus({ reconnecting: true, error: null });

    try {
      const eventSource = new EventSource('/api/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
        updateConnectionStatus({ 
          connected: true, 
          reconnecting: false, 
          error: null 
        });
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        reconnectAttemptsRef.current++;
        
        updateConnectionStatus({ 
          connected: false, 
          reconnecting: false,
          error: `Connection error (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})` 
        });

        // Attempt to reconnect if not manually closed and under max attempts
        if (!isManuallyClosedRef.current && 
            eventSource.readyState === EventSource.CLOSED &&
            reconnectAttemptsRef.current < maxReconnectAttempts) {
          
          const backoffDelay = Math.min(reconnectInterval * reconnectAttemptsRef.current, 30000);
          console.log(`Attempting to reconnect SSE in ${backoffDelay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isManuallyClosedRef.current) {
              connect();
            }
          }, backoffDelay);
        }
      };

    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      reconnectAttemptsRef.current++;
      
      updateConnectionStatus({ 
        connected: false, 
        reconnecting: false,
        error: 'Failed to connect' 
      });
      
      // Retry connection with backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const backoffDelay = Math.min(reconnectInterval * reconnectAttemptsRef.current, 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isManuallyClosedRef.current) {
            connect();
          }
        }, backoffDelay);
      }
    }
  }, [onMessage, updateConnectionStatus, reconnectInterval]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    updateConnectionStatus({ 
      connected: false, 
      reconnecting: false, 
      error: null 
    });
  }, [updateConnectionStatus]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0; // Reset attempts for manual reconnect
    disconnect();
    isManuallyClosedRef.current = false;
    setTimeout(() => connect(), 100);
  }, [connect, disconnect]);

  // Initialize connection on mount
  useEffect(() => {
    isManuallyClosedRef.current = false;
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []); // Remove dependencies to prevent reconnection loops

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    connect,
    disconnect,
    reconnect
  };
}
