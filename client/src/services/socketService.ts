import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private readonly url = 'https://edit.homejab.com/socket.io';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected us, try reconnecting manually
          this._scheduleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this._scheduleReconnect();
      });
    }
    return this.socket;
  }

  private _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    if (this.reconnectTimer) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    console.log(`[SocketService] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  joinProject(projectId: string) {
    const socket = this.connect();
    socket.emit('join-project', projectId);
  }

  onProgressUpdate(callback: (data: any) => void) {
    const socket = this.connect();
    socket.on('progress-update', callback);
  }

  onUploadComplete(callback: (data: any) => void) {
    const socket = this.connect();
    socket.on('upload-complete', callback);
  }

  onProcessingComplete(callback: (data: any) => void) {
    const socket = this.connect();
    socket.on('processing-complete', callback);
  }

  onProcessingFailed(callback: (data: any) => void) {
    const socket = this.connect();
    socket.on('processing-failed', callback);
  }

  onNotification(callback: (data: any) => void) {
    const socket = this.connect();
    socket.on('notification', callback);
  }

  offProgressUpdate() {
    if (this.socket) {
      this.socket.off('progress-update');
    }
  }

  offUploadComplete() {
    if (this.socket) {
      this.socket.off('upload-complete');
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}

export const socketService = new SocketService();
