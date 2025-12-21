import { io, Socket } from 'socket.io-client';

interface SocketEventHandlers {
  [event: string]: (...args: any[]) => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<(...args: any[]) => void>> = new Map();
  private connectPromise: Promise<void> | null = null;
  private connectResolve: (() => void) | null = null;

  constructor(private serverUrl: string = 'ws://localhost:3001') {}

  connect(userId?: string, token?: string): Promise<void> {
    // Return existing connection promise if already connecting
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        this.connectResolve = resolve;

        this.socket = io(this.serverUrl, {
          auth: {
            userId,
            token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay
        });

        const handleConnect = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;

          // Re-register all event handlers after reconnection (only once)
          this.eventHandlers.forEach((handlers, event) => {
            handlers.forEach((handler) => {
              this.socket?.on(event, handler);
            });
          });

          // Resolve the promise only on first connection
          if (this.connectResolve) {
            this.connectResolve();
            this.connectResolve = null;
          }
        };

        this.socket.on('connect', handleConnect);

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server disconnected, manual reconnection needed
            this.socket?.connect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('🚨 WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('💀 Failed to reconnect after maximum attempts');
        });

      } catch (error) {
        reject(error);
      }
    });

    return this.connectPromise;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit event: WebSocket not connected');
    }
  }

  on(event: string, handler: (...args: any[]) => void): void {
    // Store handler in map
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);

    // Register immediately if socket is connected
    if (this.socket?.connected) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler?: (...args: any[]) => void): void {
    if (!handler) {
      // Remove all handlers for this event
      this.eventHandlers.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    } else {
      // Remove specific handler
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
      if (this.socket) {
        this.socket.off(event, handler);
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Chat-specific methods
  joinRoom(roomId: string): void {
    this.emit('join_room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.emit('leave_room', { roomId });
  }

  sendMessage(roomId: string, message: any): void {
    this.emit('send_message', { roomId, message });
  }

  // Trading-specific methods
  joinTradingRoom(tradingPairId: string): void {
    this.emit('join_trading_room', { tradingPairId });
  }

  subscribeToPriceUpdates(symbols: string[]): void {
    this.emit('subscribe_prices', { symbols });
  }

  // Notification methods
  markNotificationRead(notificationId: string): void {
    this.emit('mark_notification_read', { notificationId });
  }

  // User presence methods
  updatePresence(status: 'online' | 'away' | 'offline'): void {
    this.emit('update_presence', { status });
  }

  // Battle/livestream methods
  joinBattle(battleId: string): void {
    this.emit('join_battle', { battleId });
  }

  vote(battleId: string, participantId: string): void {
    this.emit('battle_vote', { battleId, participantId });
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Connection status types
export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected?: Date;
  error?: string;
}

// Event types for type safety
export interface WebSocketEvents {
  // Chat events
  message_received: { roomId: string; message: any; sender: any };
  typing_start: { roomId: string; userId: string };
  typing_stop: { roomId: string; userId: string };
  user_joined: { roomId: string; user: any };
  user_left: { roomId: string; userId: string };
  
  // Trading events
  order_update: { orderId: string; status: string; data: any };
  price_update: { symbol: string; price: number; change: number };
  trade_executed: { tradeId: string; details: any };
  
  // Notification events
  new_notification: { notification: any };
  notification_read: { notificationId: string };
  
  // Presence events
  user_online: { userId: string };
  user_offline: { userId: string };
  
  // Battle events
  battle_started: { battleId: string; participants: any[] };
  battle_vote: { battleId: string; votes: any };
  battle_ended: { battleId: string; winner: any };
  
  // Wallet events
  balance_update: { userId: string; balance: any };
  transaction_complete: { transactionId: string; details: any };
  
  // Video events
  viewer_count_update: { videoId: string; count: number };
  ad_view_complete: { videoId: string; adId: string; reward: number };

  // Creator economy events
  creator_stats_update: { creatorId: string; stats: any };
  new_tip_received: { recipientId: string; amount: number; tip: { id: string; sender: string; message?: string; timestamp: string; currency: string; amount: number } };
  new_subscriber: { creatorId: string; subscriber: { id: string; name: string } };
  content_engagement: { creatorId: string; type: 'like' | 'share' | 'comment' | 'view'; contentId: string; contentTitle: string; contentType: 'video' | 'post' | 'livestream' };
  milestone_achieved: { creatorId: string; milestone: { id: string; title: string; target: number; reward: number } };
  livestream_viewers: { creatorId: string; count: number };
  
  // P2P Escrow events
  escrow_update: { transactionId: string; transaction: any };
  escrow_timeout_warning: { transactionId: string; timeRemaining: number };
}
