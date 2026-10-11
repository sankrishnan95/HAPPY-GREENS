import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export default function AndroidStartupIntro() {
    const [isVisible, setIsVisible] = useState(() => Capacitor.getPlatform() === 'android');
    const [needsPlaybackTap, setNeedsPlaybackTap] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!isVisible) return;

        const video = videoRef.current;
        if (!video) return;

        video.muted = true;
        void video.play()
            .then(() => setNeedsPlaybackTap(false))
            .catch(() => setNeedsPlaybackTap(true));
    }, [isVisible]);

    if (!isVisible) return null;

    const startPlayback = () => {
        const video = videoRef.current;
        if (!video) return;

        void video.play()
            .then(() => setNeedsPlaybackTap(false))
            .catch(() => setIsVisible(false));
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black" role="dialog" aria-label="Happy Greens introduction">
            <video
                ref={videoRef}
                className="h-full w-full object-contain"
                src="/happy-greens-intro.mp4"
                autoPlay
                muted
                playsInline
                preload="auto"
                aria-label="Happy Greens introduction video"
                onEnded={() => setIsVisible(false)}
                onError={() => setIsVisible(false)}
            />

            {needsPlaybackTap && (
                <button
                    type="button"
                    onClick={startPlayback}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-green-800 shadow-lg"
                >
                    Play introduction
                </button>
            )}

            <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="absolute right-5 rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
            >
                Skip intro
            </button>
        </div>
    );
}
