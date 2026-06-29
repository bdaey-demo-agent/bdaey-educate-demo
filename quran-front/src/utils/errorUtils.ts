import { AxiosError } from 'axios';

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
        if (error.response?.data) {
            // Check for common backend error formats
            if (typeof error.response.data === 'string') {
                return error.response.data;
            }
            if (error.response.data.message) {
                return error.response.data.message;
            }
            if (error.response.data.title) {
                return error.response.data.title;
            }
            if (error.response.data.errors) {
                // Return first validation error if available
                const errors = error.response.data.errors;
                if (typeof errors === 'object') {
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') return firstError;
                    if (Array.isArray(firstError) && firstError.length > 0) return firstError[0];
                }
            }
        }
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};
