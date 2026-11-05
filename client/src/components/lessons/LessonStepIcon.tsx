import type { LessonIcon } from '../../types/lesson';

const ICON_PATHS: Record<LessonIcon, string> = {
  sun: 'M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  water: 'M12 3C9.4 6.7 6 10.1 6 14a6 6 0 0 0 12 0c0-3.9-3.4-7.3-6-11Zm-3 12a3 3 0 0 0 3 3',
  cover: 'M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6',
  soil: 'M4 19c3-2 5-2 8 0s5 2 8 0M4 15c3-2 5-2 8 0s5 2 8 0M12 4v7m0-3C9 8 8 6 8 4c3 0 4 2 4 4Zm0-1c0-3 2-4 5-4 0 3-2 5-5 5',
  leaf: 'M20 4C12 4 6 7 6 13a5 5 0 0 0 5 5c6 0 9-6 9-14ZM4 21c2-5 5-8 10-11',
  animal: 'M7 10 5 6m12 4 2-4M5 14c0-3 3-5 7-5s7 2 7 5-3 6-7 6-7-3-7-6Zm3 1h.01M16 15h.01M10 17h4',
  fence: 'M4 20V5m8 15V5m8 15V5M2 9h20M2 15h20',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
};

export function LessonStepIcon({ icon }: { icon: LessonIcon }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-leaf-100 to-wheat-100 text-leaf-800 shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={ICON_PATHS[icon]} />
      </svg>
    </span>
  );
}
