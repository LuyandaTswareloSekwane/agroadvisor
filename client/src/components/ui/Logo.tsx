interface LogoProps {
  className?: string;
}

/** AgroAdvisor mark: sunrise, cultivated rows, and new growth. */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="10" className="fill-leaf-900" />
      <circle cx="23" cy="9" r="3" className="fill-wheat-300" />
      <path d="M5 22c5-3 9-3 14 0s7 3 9 2v3H5v-5Z" className="fill-leaf-700" />
      <path d="M5 25c5-2 9-2 14 0s7 2 9 1v2H5v-3Z" className="fill-wheat-400" />
      <path d="M15 23V13" className="stroke-wheat-50" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15 17c-3.8 0-5.8-2-5.8-5.8 3.8 0 5.8 2 5.8 5.8Z" className="fill-leaf-300" />
      <path d="M15 15.5c0-3.8 2-5.8 5.8-5.8 0 3.8-2 5.8-5.8 5.8Z" className="fill-wheat-200" />
      <path d="M8 23.5c4-1.6 7-1.6 10 0" fill="none" className="stroke-leaf-200" strokeWidth=".8" />
    </svg>
  );
}
