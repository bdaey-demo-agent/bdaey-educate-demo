import { BASE_URL } from '../config';

export const getFileUrl = (url?: string | null): string => {
    if (!url) return '';
    
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    // Fix common malformed URLs
    if (url.startsWith('https//') || url.startsWith('http//')) {
        return url.replace('https//', 'https://').replace('http//', 'http://');
    }
    
    // Prepend BASE_URL if it's a relative path
    // Ensure no double slashes
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${BASE_URL}${cleanUrl}`;
};
