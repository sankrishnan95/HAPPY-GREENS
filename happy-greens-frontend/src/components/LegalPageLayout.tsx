import type { ReactNode } from 'react';

type LegalPageLayoutProps = {
    title: string;
    effectiveDate: string;
    lastUpdated: string;
    children: ReactNode;
};

const LegalPageLayout = ({ title, effectiveDate, lastUpdated, children }: LegalPageLayoutProps) => {
    return (
        <div className="mx-auto max-w-4xl py-8 sm:py-10">
            <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-soft sm:p-7 lg:p-8">
                <div className="border-b border-gray-100 pb-5 sm:pb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">Happy Greens</p>
                    <h1 className="mt-3 text-3xl font-display font-bold text-gray-900 sm:text-4xl">{title}</h1>
                    <div className="mt-4 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:gap-6">
                        <span>Effective Date: {effectiveDate}</span>
                        <span>Last Updated: {lastUpdated}</span>
                    </div>
                </div>

                <div className="mt-6 max-w-none text-gray-700 text-sm sm:text-base leading-7 [&_p]:leading-7 [&_li]:leading-7 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_h2]:font-display [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:!text-xl [&_h2]:font-bold [&_h2]:leading-tight sm:[&_h2]:!text-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default LegalPageLayout;
