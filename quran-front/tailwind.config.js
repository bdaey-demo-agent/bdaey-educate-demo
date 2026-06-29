/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable dark mode manually
    theme: {
        extend: {
            colors: {
                'primary-green': 'var(--primary-green)',
                'primary-green-light': 'var(--primary-green-light)',
                'primary-green-lighter': 'var(--primary-green-lighter)',
                'primary-gold': 'var(--primary-gold)',
                'primary-gold-light': 'var(--primary-gold-light)',
                'primary-gold-lighter': 'var(--primary-gold-lighter)',

                // Secondary
                'secondary-blue': 'var(--secondary-blue)',
                'secondary-teal': 'var(--secondary-teal)',
                'secondary-orange': 'var(--secondary-orange)',
                'secondary-red': 'var(--secondary-red)',
                'secondary-purple': 'var(--secondary-purple)',

                // Neutral
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',

                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                'text-light': 'var(--text-light)',

                // Status
                'success-bg': 'var(--success-bg)',
                'success-text': 'var(--success-text)',
                'warning-bg': 'var(--warning-bg)',
                'warning-text': 'var(--warning-text)',
                'error-bg': 'var(--error-bg)',
                'error-text': 'var(--error-text)',
                'info-bg': 'var(--info-bg)',
                'info-text': 'var(--info-text)',

                // Border
                'border-light': 'var(--border-light)',
                'border-medium': 'var(--border-medium)',
                'border-dark': 'var(--border-dark)',

                // Compatibility / Legacy
                tomato: {
                    50: '#fff2f0',
                    100: '#ffe1de',
                    200: '#ffc5bf',
                    300: '#ffa199',
                    400: '#ff7063',
                    500: '#ff6347',
                    600: '#ed3b2f',
                    700: '#c72620',
                    800: '#a3221f',
                    900: '#872120',
                },
                primary: {
                    DEFAULT: 'var(--primary-green)',
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    500: 'var(--primary-green)',
                    600: 'var(--primary-green-light)',
                    900: '#14532d',
                },
                gold: {
                    500: 'var(--primary-gold)',
                    600: 'var(--primary-gold-light)',
                }
            },
            fontFamily: {
                heading: ['var(--font-arabic-heading)', 'serif'],
                body: ['var(--font-arabic-body)', 'sans-serif'],
                latinHeading: ['var(--font-latin-heading)', 'sans-serif'],
                latinBody: ['var(--font-latin-body)', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
