const AndroidIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
    <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="m7.2 6.7-1.4-2.3M16.8 6.7l1.4-2.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M5.5 10a6.5 6.5 0 0 1 13 0v1h-13v-1Z" fill="currentColor" />
        <circle cx="9" cy="8.7" r=".65" fill="white" />
        <circle cx="15" cy="8.7" r=".65" fill="white" />
        <rect x="6" y="12" width="12" height="6.5" rx="1.4" fill="currentColor" />
        <path d="M4.5 12.8v4M19.5 12.8v4M9 18.7v2M15 18.7v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
);

export default AndroidIcon;
