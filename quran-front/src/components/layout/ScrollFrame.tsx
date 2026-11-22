
import React, { useEffect, useState } from 'react';

const ScrollFrame: React.FC = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

            if (windowHeight === 0) {
                setProgress(0);
                return;
            }

            const scroll = totalScroll / windowHeight;
            setProgress(Math.min(Math.max(scroll, 0), 1));
        };

        window.addEventListener('scroll', handleScroll);
        // Trigger once on mount
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Calculate progress for each side (0-25% each)
    // Top: 0-0.25 -> 0-100%
    const topProgress = Math.min(Math.max(progress * 4, 0), 1) * 100;

    // Right: 0.25-0.5 -> 0-100%
    const rightProgress = Math.min(Math.max((progress - 0.25) * 4, 0), 1) * 100;

    // Bottom: 0.5-0.75 -> 0-100%
    const bottomProgress = Math.min(Math.max((progress - 0.5) * 4, 0), 1) * 100;

    // Left: 0.75-1.0 -> 0-100%
    const leftProgress = Math.min(Math.max((progress - 0.75) * 4, 0), 1) * 100;



    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden="true">
            {/* Top Bar (Left to Right) */}
            <div
                className="absolute top-0 left-0 h-[3px] bg-primary-green transition-all duration-75 ease-out shadow-[0_0_10px_var(--primary-green-lighter)]"
                style={{ width: `${topProgress}%` }}
            />

            {/* Right Bar (Top to Bottom) */}
            <div
                className="absolute top-0 right-0 w-[3px] bg-primary-green transition-all duration-75 ease-out shadow-[0_0_10px_var(--primary-green-lighter)]"
                style={{ height: `${rightProgress}%` }}
            />

            {/* Bottom Bar (Right to Left) */}
            <div
                className="absolute bottom-0 right-0 h-[3px] bg-primary-green transition-all duration-75 ease-out shadow-[0_0_10px_var(--primary-green-lighter)]"
                style={{ width: `${bottomProgress}%` }}
            />

            {/* Left Bar (Bottom to Top) */}
            <div
                className="absolute bottom-0 left-0 w-[3px] bg-primary-green transition-all duration-75 ease-out shadow-[0_0_10px_var(--primary-green-lighter)]"
                style={{ height: `${leftProgress}%` }}
            />
        </div>
    );
};

export default ScrollFrame;
