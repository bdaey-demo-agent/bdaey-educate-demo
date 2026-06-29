import * as signalR from '@microsoft/signalr';
import { BASE_URL } from '../config';

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private callbacks: { [event: string]: ((message: any) => void)[] } = {};

    public async startConnection(token: string) {
        if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) return;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${BASE_URL}/hub`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.None) // Disable logs used for debugging
            .build();

        this.connection.on('ReceiveNotification', (message: string) => {
            // console.log('Notification received:', message);
            this.trigger('ReceiveNotification', message);
        });

        this.connection.on('ReceiveMessage', (data: any) => {
            // console.log('Message received:', data);
            this.trigger('ReceiveMessage', data);
        });

        this.connection.on('ForceDisconnect', (sessionId: any) => {
            // console.log('ForceDisconnect received:', sessionId);
            this.trigger('ForceDisconnect', sessionId);
        });

        try {
            await this.connection.start();
            // console.log('SignalR Connected Successfully');
        } catch (err) {
            console.error('SignalR Connection Error: ', err);
        }
    }

    public on(event: string, callback: (message: any) => void) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    public off(event: string, callback: (message: any) => void) {
        if (!this.callbacks[event]) return;
        this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }

    private trigger(event: string, message: any) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(message));
        }
    }

    public async stopConnection() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }

    public getConnectionId(): string | null {
        return this.connection?.connectionId || null;
    }
}

export const signalRService = new SignalRService();
