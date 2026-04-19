import { captureFrontendException, captureFrontendMessage } from '../lib/monitoring/sentry';

const MonitoringDebug = () => {
    const triggerFrontendError = () => {
        const error = new Error('Sentry frontend test error');
        captureFrontendException(error, { source: 'monitoring_debug_page' });
        throw error;
    };

    const triggerHandledMessage = () => {
        captureFrontendMessage('Sentry frontend test message', { source: 'monitoring_debug_page' });
    };

    return (
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-display font-bold text-slate-900">Monitoring Debug</h1>
            <p className="mt-2 text-sm text-slate-600">
                Use this page once after setup to confirm frontend Sentry capture.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={triggerFrontendError}
                    className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                    Trigger frontend error
                </button>
                <button
                    type="button"
                    onClick={triggerHandledMessage}
                    className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                    Send handled Sentry message
                </button>
                <a
                    href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debug/sentry`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                    Trigger backend error
                </a>
            </div>
        </div>
    );
};

export default MonitoringDebug;
