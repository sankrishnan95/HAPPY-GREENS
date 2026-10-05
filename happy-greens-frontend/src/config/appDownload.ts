const configuredDownloadUrl = import.meta.env.VITE_ANDROID_APP_DOWNLOAD_URL?.trim() ?? '';

export const ANDROID_APP_DOWNLOAD_URL = (() => {
    if (!configuredDownloadUrl) return '';

    try {
        const url = new URL(configuredDownloadUrl);
        return url.protocol === 'https:' ? url.toString() : '';
    } catch {
        return '';
    }
})();
