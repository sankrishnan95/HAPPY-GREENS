declare global {
    interface Window {
        dataLayer: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const GA_SCRIPT_ID = 'happy-greens-ga4';

let initialized = false;

const isEnabled = () => Boolean(GA_MEASUREMENT_ID && typeof window !== 'undefined');

const ensureDataLayer = () => {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
        window.gtag ||
        function gtag(...args: unknown[]) {
            window.dataLayer.push(args);
        };
};

export const initGoogleAnalytics = () => {
    if (!isEnabled() || initialized) return;

    ensureDataLayer();

    if (!document.getElementById(GA_SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id = GA_SCRIPT_ID;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);
    }

    window.gtag?.('js', new Date());
    window.gtag?.('config', GA_MEASUREMENT_ID, {
        send_page_view: false,
        debug_mode: import.meta.env.DEV,
    });

    initialized = true;
};

export const trackGaPageView = (path: string) => {
    if (!isEnabled()) return;

    window.gtag?.('event', 'page_view', {
        page_title: document.title,
        page_path: path,
        page_location: `${window.location.origin}${path}`,
    });
};

export const trackGaEvent = (eventName: string, params: Record<string, unknown> = {}) => {
    if (!isEnabled()) return;
    window.gtag?.('event', eventName, params);
};
