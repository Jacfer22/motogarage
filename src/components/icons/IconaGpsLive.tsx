/** Icona traccia GPS — pin + onde + tracciato (mobile e desktop). */
export default function IconaGpsLive({
  size = 36,
  className = 'text-brand',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="10.5" r="7.5" stroke="currentColor" strokeWidth="1.15" opacity="0.22" />
      <circle cx="12" cy="10.5" r="4.5" stroke="currentColor" strokeWidth="1.15" opacity="0.45" />
      <path
        d="M12 3.5v1.8M12 15.7v1.8M4.5 10.5h1.8M17.7 10.5h1.8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M12 10.5l-4.2 6.8a1 1 0 0 0 .85 1.5h6.7a1 1 0 0 0 .85-1.5L12 10.5z"
        fill="currentColor"
        fillOpacity="0.92"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.2" r="1.35" fill="#0F0B0A" stroke="currentColor" strokeWidth="0.8" />
      <path
        d="M4.5 18.5c2.2-2.8 4.8-4.2 7.5-4.2s5.3 1.4 7.5 4.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="4.5" cy="18.5" r="1.1" fill="currentColor" />
      <circle cx="19.5" cy="18.5" r="1.1" fill="currentColor" />
      <circle cx="12" cy="14.3" r="0.85" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
