import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export default function AndroidStartupIntro() {
    const [isVisible, setIsVisible] = useState(() => Capacitor.getPlatform() === 'android');
    const [needsPlaybackTap, setNeedsPlaybackTap] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const closeTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isVisible) return;

        const video = videoRef.current;
        if (!video) return;

        video.muted = true;
        void video.play()
            .then(() => setNeedsPlaybackTap(false))
            .catch(() => setNeedsPlaybackTap(true));
    }, [isVisible]);

    useEffect(() => () => {
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
        }
    }, []);

    const closeIntro = () => {
        if (closeTimerRef.current !== null) return;

        setIsFadingOut(true);
        closeTimerRef.current = window.setTimeout(() => setIsVisible(false), 500);
    };

    if (!isVisible) return null;

    const startPlayback = () => {
        const video = videoRef.current;
        if (!video) return;

        void video.play()
            .then(() => setNeedsPlaybackTap(false))
            .catch(() => setIsVisible(false));
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] overflow-hidden bg-black transition-opacity duration-700 ease-out ${isRevealed && !isFadingOut ? 'opacity-100' : 'opacity-0'}`}
            role="dialog"
            aria-label="Happy Greens introduction"
        >
            <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                src="/happy-greens-intro.mp4"
                autoPlay
                muted
                playsInline
                preload="auto"
                aria-label="Happy Greens introduction video"
                onCanPlay={() => setIsRevealed(true)}
                onPlaying={() => {
                    setIsRevealed(true);
                    setNeedsPlaybackTap(false);
                }}
                onEnded={closeIntro}
                onError={closeIntro}
            />

            {needsPlaybackTap && (
                <button
                    type="button"
                    onClick={startPlayback}
                    className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-green-800 shadow-lg"
                >
                    Play introduction
                </button>
            )}
        </div>
    );
}
