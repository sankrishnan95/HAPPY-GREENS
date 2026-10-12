import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export default function AndroidStartupIntro() {
    const [isVisible, setIsVisible] = useState(() => Capacitor.getPlatform() === 'android');
    const [isFadingOut, setIsFadingOut] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const closeTimerRef = useRef<number | null>(null);

    const closeIntro = useCallback(() => {
        if (closeTimerRef.current !== null) return;

        setIsFadingOut(true);
        closeTimerRef.current = window.setTimeout(() => setIsVisible(false), 500);
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const video = videoRef.current;
        if (!video) return;

        video.muted = true;
        video.playsInline = true;

        const tryPlayback = () => {
            if (video.paused) {
                void video.play().catch(() => {
                    // Retry when the local video has enough data to begin playback.
                });
            }
        };

        video.addEventListener('canplay', tryPlayback);
        if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            tryPlayback();
        }

        const playbackTimeout = window.setTimeout(() => {
            if (video.paused) closeIntro();
        }, 8000);

        return () => {
            video.removeEventListener('canplay', tryPlayback);
            window.clearTimeout(playbackTimeout);
        };
    }, [closeIntro, isVisible]);

    useEffect(() => () => {
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] overflow-hidden bg-black transition-opacity duration-700 ease-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
            role="dialog"
            aria-label="Happy Greens introduction"
        >
            <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                src="/happy-greens-intro.mp4"
                muted
                playsInline
                controls={false}
                preload="auto"
                aria-label="Happy Greens introduction video"
                onEnded={closeIntro}
                onError={closeIntro}
            />
        </div>
    );
}
