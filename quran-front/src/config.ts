// Helper to determine the API URL dynamically
const getApiUrl = () => {
    const hostname = window.location.hostname;

    // 1. Prefer Environment Variable (e.g. from .env)
    if (import.meta.env.VITE_API_BASE_URL) {
        let envUrl = import.meta.env.VITE_API_BASE_URL;
        if (envUrl.includes('localhost')) {
            envUrl = envUrl.replace('localhost', hostname);
        }
        return envUrl;
    }

    // 2. Production (Fly.io dynamic tenant mapping)
    if (hostname.includes('bdaey.com')) {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
            const subdomain = parts[0];
            if (subdomain === 'lms' || subdomain === 'quran') return 'https://api.lms.bdaey.com/api';
            return `https://${subdomain}.lms.bdaey.com/api`;
        }
        return 'https://bdaey-quran.fly.dev/api';
    }

    if (hostname.includes('vercel.app')) {
        return 'https://bdaey-quran.fly.dev/api';
    }

    // 3. Localhost Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const url = 'https://localhost:5001/api';
        console.log(`[Config] Development Mode: Using API URL ${url}`);
        return url;
    }

    // 4. Local Network / WiFi (Access via IP)
    // IMPORTANT: Since Frontend is HTTPS, Backend MUST also be HTTPS to avoid Mixed Content errors.
    // Users must accept the certificate warning for port 5001 on the device.
    const networkUrl = `https://${hostname}:5001/api`;
    console.log(`[Config] Network Mode: Using API URL ${networkUrl}`);
    return networkUrl;
};

export const API_BASE_URL = getApiUrl();

// BASE_URL in this project refers to the backend root (for SignalR and images)
// It is derived from API_BASE_URL by removing the /api suffix
export const BASE_URL = API_BASE_URL.replace(/\/api$/, '').replace(/\/api\/$/, '');

// Optional: Frontend URL for links back to the site (VITE_BASE_URL from env)
export const FRONTEND_URL = import.meta.env.VITE_BASE_URL || window.location.origin;