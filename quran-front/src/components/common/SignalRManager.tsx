import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { signalRService } from '../../services/signalrService';
import toast from 'react-hot-toast';

const SignalRManager: React.FC = () => {
    const { token, user } = useAuth();

    useEffect(() => {
        if (token && user) {
            // Start connection
            signalRService.startConnection(token);

            // Listen for notifications
            const handleNotification = (notification: any) => {
                // The backend sends an object { id, title, message, type... }
                // We need to extract the text to display.
                const text = notification?.message || notification?.title || (typeof notification === 'string' ? notification : 'New Notification');

                toast(text, {
                    icon: '🔔',
                    duration: 5000,
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                });
            };

            signalRService.on('ReceiveNotification', handleNotification);

            return () => {
                // Cleanup
                signalRService.off('ReceiveNotification', handleNotification);
                // We might not want to stop connection on every render if token changes, 
                // but usually token is stable. 
                // Strict mode might cause double connect, but service handles that.
            };
        }
    }, [token, user]);

    return null; // This component doesn't render anything visible
};

export default SignalRManager;
