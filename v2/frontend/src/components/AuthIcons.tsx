export function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.29h6.45a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.56-5.17 3.56-8.65Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.01c-1.08.72-2.46 1.14-4.05 1.14-3.12 0-5.76-2.1-6.7-4.93H1.3v3.1A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.77l3.43-3.43C17.94 1.17 15.24 0 12 0A11.99 11.99 0 0 0 1.3 6.6l4 3.1c.94-2.84 3.58-4.93 6.7-4.93Z"
      />
    </svg>
  );
}

export function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
        <path
          fill="currentColor"
          d="M12 5c4.89 0 8.98 2.5 11 7-2.02 4.5-6.11 7-11 7S3.02 16.5 1 12c2.02-4.5 6.11-7 11-7Zm0 11.25A4.25 4.25 0 1 0 12 7.75a4.25 4.25 0 0 0 0 8.5Zm0-2A2.25 2.25 0 1 1 12 9.75a2.25 2.25 0 0 1 0 4.5Z"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
      <path
        fill="currentColor"
        d="M3.28 2.22 1.86 3.64l3.05 3.05A11.28 11.28 0 0 0 1 12c2.02 4 6.11 6.5 11 6.5 1.89 0 3.66-.37 5.24-1.05l3.54 3.55 1.42-1.42L3.28 2.22Zm8.72 14.28c-3.77 0-6.97-2.18-8.7-5.5a9.08 9.08 0 0 1 3.07-3.53l1.57 1.56A4.98 4.98 0 0 0 12 17Zm0-9.5c2.76 0 5 2.24 5 5 0 .62-.12 1.2-.33 1.73l-1.64-1.64c-.25-1.59-1.51-2.84-3.09-3.1L9.95 7.94c.62-.6 1.45-.94 2.05-.94Zm9.7 5a9.99 9.99 0 0 1-3.02 3.48l-1.42-1.42A7.78 7.78 0 0 0 20.7 12c-1.72-3.32-4.93-5.5-8.7-5.5-.95 0-1.86.14-2.71.4L7.62 5.23A11.72 11.72 0 0 1 12 4.5c4.89 0 8.98 2.5 11 6.5Z"
      />
    </svg>
  );
}

export function Spinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] animate-spin">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
      <path fill="currentColor" d="M22 12a10 10 0 0 0-10-10v4a6 6 0 0 1 6 6h4Z" />
    </svg>
  );
}
