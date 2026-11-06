import { useEffect, useState, type FormEvent } from 'react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/PageLoader';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { LANGUAGE_LOCALES, type AppLanguage } from '../i18n';
import { formatLocalizedDate } from '../utils/weatherAdvice';
import {
  addFarmMemoryEntry,
  deleteFarmMemoryEntry,
  FarmMemoryValidationError,
  getFarmMemory,
  getFarmMemoryErrorMessage,
  getMoreFarmMemory,
} from '../services/farmMemoryService';
import { getFarm, getFarmLoadErrorMessage } from '../services/farmService';
import type { FarmMemoryEntry, FarmMemoryLogType, FarmMemoryType } from '../types/farmMemory';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

const MEMORY_TYPE_KEYS: Record<FarmMemoryType, string> = {
  weather: 'memory.typeWeather',
  planting: 'memory.typePlanting',
  success: 'memory.typeSuccess',
  lesson: 'memory.typeLesson',
};

const LOG_TYPES: readonly FarmMemoryLogType[] = ['weather', 'planting', 'success'];

function isLogType(value: string): value is FarmMemoryLogType {
  return LOG_TYPES.some((item) => item === value);
}

function localDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function MemoryIcon({ type, className = 'h-5 w-5' }: { type: FarmMemoryType; className?: string }) {
  if (type === 'weather') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 18a4 4 0 1 1 .8-7.9A5.5 5.5 0 0 1 18 12a3 3 0 0 1-.5 6H7Z" />
        <path d="m9 15-1 2m6-2-1 2" />
      </svg>
    );
  }
  if (type === 'planting') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21v-9m0 4c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Zm0-3c0-4 2-6 6-6 0 4-2 6-6 6Z" />
        <path d="M4 21h16" />
      </svg>
    );
  }
  if (type === 'lesson') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5v-17Z" />
        <path d="M4 6h12m-8 4h7m-7 4h7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  );
}

function formatEntryDate(entry: FarmMemoryEntry, language: AppLanguage): string {
  return formatLocalizedDate(entry.occurredAt.toDate(), language);
}

export function FarmMemoryPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const ownerId = user?.uid ?? null;
  const farm = useAsyncData(ownerId, getFarm);
  const memory = useAsyncData(ownerId, getFarmMemory);
  const [type, setType] = useState<FarmMemoryLogType>('weather');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [occurredOn, setOccurredOn] = useState(() => localDateValue(new Date()));
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [olderEntries, setOlderEntries] = useState<FarmMemoryEntry[]>([]);
  const [olderCursor, setOlderCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setOlderEntries([]);
    setOlderCursor(memory.data?.recentCursor ?? null);
    setHasMoreOlder(memory.data?.hasMoreRecent ?? false);
  }, [memory.data]);

  const locale = LANGUAGE_LOCALES[language];
  const week = weekRange(new Date());
  const weekLabel = `${formatLocalizedDate(week.start, language, false)} – ${formatLocalizedDate(week.end, language, false)}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerId) return;
    setIsSaving(true);
    setActionError(null);
    setActionNotice(null);
    try {
      await addFarmMemoryEntry(ownerId, { type, title, note, occurredOn });
      setTitle('');
      setNote('');
      setActionNotice(t('memory.saved'));
      memory.reload();
    } catch (error: unknown) {
      setActionError(error instanceof FarmMemoryValidationError
        ? t('memory.invalid')
        : getFarmMemoryErrorMessage(error, 'save your farm memory'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(entry: FarmMemoryEntry) {
    if (!ownerId || !window.confirm(t('memory.confirmDelete'))) return;
    setDeletingId(entry.id);
    setActionError(null);
    setActionNotice(null);
    try {
      await deleteFarmMemoryEntry(ownerId, entry.id);
      setActionNotice(t('memory.deleted'));
      memory.reload();
    } catch (error: unknown) {
      setActionError(getFarmMemoryErrorMessage(error, 'remove this farm memory'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLoadMore() {
    if (!ownerId || !olderCursor || !hasMoreOlder) return;
    setIsLoadingMore(true);
    setActionError(null);
    try {
      const page = await getMoreFarmMemory(ownerId, olderCursor);
      setOlderEntries((current) => [...current, ...page.entries]);
      setOlderCursor(page.cursor);
      setHasMoreOlder(page.hasMore);
    } catch (error: unknown) {
      setActionError(getFarmMemoryErrorMessage(error, 'load older farm memories'));
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (farm.isLoading) return <PageLoader label={t('memory.title')} />;

  if (farm.error !== null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="error">{getFarmLoadErrorMessage(farm.error)}</Alert>
        <Button variant="secondary" onClick={farm.reload}>{t('weather.tryAgain')}</Button>
      </div>
    );
  }

  if (!farm.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="border-leaf-100 bg-gradient-to-br from-white via-leaf-50/60 to-wheat-50/70 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-800">
            <MemoryIcon type="planting" className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-leaf-900">{t('memory.title')}</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-soil-600">{t('memory.setupText')}</p>
          <div className="mt-5">
            <ButtonLink to="/farm">{t('dashboard.setupButton')}</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  if (memory.isLoading) return <PageLoader label={t('memory.title')} />;

  if (memory.error !== null || !memory.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="error">
          {memory.error !== null
            ? getFarmMemoryErrorMessage(memory.error, 'load your farm memory')
            : t('memory.loadError')}
        </Alert>
        <Button variant="secondary" onClick={memory.reload}>{t('weather.tryAgain')}</Button>
      </div>
    );
  }

  const { recentEntries, weekEntries } = memory.data;
  const visibleEntries = [...recentEntries, ...olderEntries];
  const counts = new Map<FarmMemoryType, number>(([...LOG_TYPES, 'lesson'] as const).map((entryType) => [
    entryType,
    weekEntries.filter((entry) => entry.type === entryType).length,
  ]));
  const maxDate = localDateValue(new Date());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-leaf-900 via-leaf-800 to-emerald-500 px-5 py-7 text-white shadow-xl shadow-leaf-900/15 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full bg-citrus-300/25 blur-3xl" aria-hidden="true" />
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/95 backdrop-blur-sm">
          <MemoryIcon type="success" className="h-4 w-4 text-citrus-300" />
          {t('memory.path')}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{t('memory.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">{t('memory.intro')}</p>
        <div className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/95">
          <span>{farm.data.name}</span>
          <span aria-hidden="true">·</span>
          <span>{t('farm.near', {
            place: farm.data.locationName,
            size: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(farm.data.sizeHectares),
          })}</span>
        </div>
      </header>

      <section aria-labelledby="memory-week-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="memory-week-heading" className="text-xl font-extrabold tracking-tight text-leaf-900">{t('memory.weekTitle')}</h2>
            <p className="mt-1 text-sm text-soil-600">{t('memory.weekRange', { range: weekLabel })}</p>
          </div>
          <span className="rounded-full border border-leaf-100 bg-white px-3 py-1.5 text-xs font-bold text-leaf-800">
            {t('memory.weekCount', { count: weekEntries.length })}
          </span>
        </div>
        <p className="mb-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm leading-5 text-sky-950">
          {t('memory.weekNote')}
        </p>
        {weekEntries.length === 0 ? (
          <Card className="border-leaf-100 bg-gradient-to-r from-white to-leaf-50/60">
            <p className="text-sm leading-6 text-soil-700">{t('memory.weekEmpty')}</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {([...LOG_TYPES, 'lesson'] as const).map((entryType) => (
              <Card key={entryType} className="flex items-center gap-3 border-leaf-100 bg-gradient-to-br from-white to-leaf-50/50 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf-100 text-leaf-800">
                  <MemoryIcon type={entryType} />
                </span>
                <div>
                  <p className="text-2xl font-extrabold leading-none text-leaf-900">{counts.get(entryType) ?? 0}</p>
                  <p className="mt-1 text-xs font-semibold text-soil-600">{t(MEMORY_TYPE_KEYS[entryType])}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
        {weekEntries.length === 100 && (
          <p className="mt-3 text-xs text-soil-600">{t('memory.weekLimit')}</p>
        )}
      </section>

      {actionError && <Alert tone="error">{actionError}</Alert>}
      {actionNotice && <Alert>{actionNotice}</Alert>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-leaf-100 bg-gradient-to-br from-white via-leaf-50/40 to-wheat-50/60">
          <h2 className="text-lg font-extrabold text-leaf-900">{t('memory.addTitle')}</h2>
          <p className="mt-1 text-sm leading-5 text-soil-600">{t('memory.addIntro')}</p>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="memory-type" className="block text-sm font-semibold text-soil-800">{t('memory.typeLabel')}</label>
              <select
                id="memory-type"
                value={type}
                onChange={(event) => {
                  if (isLogType(event.target.value)) setType(event.target.value);
                }}
                className="mt-1 min-h-11 w-full rounded-lg border border-soil-200 bg-white px-3 text-base text-soil-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500"
              >
                {LOG_TYPES.map((entryType) => (
                  <option key={entryType} value={entryType}>{t(MEMORY_TYPE_KEYS[entryType])}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="memory-title" className="block text-sm font-semibold text-soil-800">{t('memory.entryTitle')}</label>
              <input
                id="memory-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
                className="mt-1 min-h-11 w-full rounded-lg border border-soil-200 bg-white px-3 text-base text-soil-900 placeholder:text-soil-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500"
              />
            </div>
            <div>
              <label htmlFor="memory-date" className="block text-sm font-semibold text-soil-800">{t('memory.dateLabel')}</label>
              <input
                id="memory-date"
                type="date"
                value={occurredOn}
                max={maxDate}
                onChange={(event) => setOccurredOn(event.target.value)}
                required
                className="mt-1 min-h-11 w-full rounded-lg border border-soil-200 bg-white px-3 text-base text-soil-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500"
              />
            </div>
            <div>
              <label htmlFor="memory-note" className="block text-sm font-semibold text-soil-800">{t('memory.noteLabel')}</label>
              <textarea
                id="memory-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                rows={3}
                className="mt-1 w-full resize-y rounded-lg border border-soil-200 bg-white px-3 py-2 text-base text-soil-900 placeholder:text-soil-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500"
              />
            </div>
            <Button type="submit" fullWidth isLoading={isSaving}>{t('memory.save')}</Button>
          </form>
        </Card>

        <section aria-labelledby="memory-recent-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 id="memory-recent-heading" className="text-xl font-extrabold tracking-tight text-leaf-900">{t('memory.recentTitle')}</h2>
            <span className="text-xs font-medium text-soil-500">{t('memory.privateLabel')}</span>
          </div>
          {visibleEntries.length === 0 ? (
            <Card className="border-dashed border-leaf-200 bg-white/80">
              <p className="text-sm leading-6 text-soil-600">{t('memory.recentEmpty')}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              <ol className="space-y-3">
                {visibleEntries.map((entry) => (
                  <li key={entry.id}>
                    <Card className="border-leaf-100 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-leaf-100 to-wheat-100 text-leaf-800">
                          <MemoryIcon type={entry.type} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-leaf-700">{t(MEMORY_TYPE_KEYS[entry.type])}</span>
                            <time className="text-xs text-soil-500" dateTime={entry.occurredAt.toDate().toISOString()}>
                              {formatEntryDate(entry, language)}
                            </time>
                          </div>
                          <h3 className="mt-1 break-words text-base font-bold text-soil-900">{entry.title}</h3>
                          {entry.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-soil-600">{entry.note}</p>}
                        </div>
                        <button
                          type="button"
                          aria-label={t('memory.removeNamed', { name: entry.title })}
                          disabled={deletingId !== null}
                          onClick={() => void handleDelete(entry)}
                          className="min-h-10 shrink-0 rounded-lg px-2 text-xs font-bold text-soil-500 underline decoration-soil-300 underline-offset-2 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 disabled:opacity-50"
                        >
                          {deletingId === entry.id ? t('memory.removing') : t('memory.remove')}
                        </button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
              {hasMoreOlder && (
                <Button variant="secondary" fullWidth isLoading={isLoadingMore} onClick={() => void handleLoadMore()}>
                  {isLoadingMore ? t('memory.loadingMore') : t('memory.loadMore')}
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
