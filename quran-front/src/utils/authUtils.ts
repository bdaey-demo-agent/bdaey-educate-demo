export const handleAuthError = (err: any, navigate: any, setError: (msg: string) => void) => {
    // Check for 403 Forbidden
    if (err.response && err.response.status === 403) {
        // Check for specific "AccountSuspended" code (JSON) OR string body
        const isSuspended =
            err.response.data?.code === "AccountSuspended" ||
            err.response.data === "AccountSuspended";

        if (isSuspended) {
            localStorage.setItem('isSuspended', 'true');
            navigate('/suspended');
            return;
        }
    }

    // Default error handling
    const msg = err.response?.data?.message || err.response?.data || 'Sign-in failed. Please check your credentials.';
    setError(typeof msg === 'string' ? msg : 'Sign-in failed. Please check your credentials.');
    console.error(err);
};
