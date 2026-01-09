import { io } from 'socket.io-client';
import { SOCKET_URL } from '../lib/constants';

class SocketService {
    private socket: any; // Declare the socket property
    constructor() {
        this.socket = null;
    }

    connect(token:string) {
        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event:any, callback:any) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event:any) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    emit(event:any, data:any) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    getSocket() {
        return this.socket;
    }
}

export default new SocketService();