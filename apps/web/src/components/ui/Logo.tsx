interface LogoProps {
  size?: number;

  wordmark?: boolean;
  className?: string;
}

export function Logo({ size = 32, wordmark = false, className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="shiftos-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3E7BFA" />
            <stop offset="1" stopColor="#2258D6" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="13" fill="url(#shiftos-logo-grad)" />
        <path d="M14 12.5A1.5 1.5 0 0 1 15.5 11H27v26H15.5a1.5 1.5 0 0 1-1.5-1.5v-23Z" fill="white" />
        <circle cx="19.2" cy="24" r="1.7" fill="#2258D6" />
        <path d="M27 11 34.3 13.6a1.5 1.5 0 0 1 1 1.41v17.98a1.5 1.5 0 0 1-1 1.41L27 37V11Z" fill="white" fillOpacity="0.55" />
        <circle cx="30.6" cy="24" r="1.4" fill="#2258D6" />
      </svg>
      {wordmark && (
        <span className="font-bold tracking-tight text-[var(--color-text)]" style={{ fontSize: size * 0.5 }}>
          ShiftOS
        </span>
      )}
    </div>
  );
}
