import { useEffect, useRef, useState } from 'react';
import type { VisionItemType, VisionRecognition } from '../../types/vision';
import { identifyFarmImage } from '../../services/visionService';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { useLanguage } from '../../hooks/useLanguage';
import { translateFarmTerm } from '../../i18n';

interface ImageIdentifierProps {
  itemType: VisionItemType;
  onAdd: (name: string) => boolean;
  suggestions?: string[];
}

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'result'; result: VisionRecognition; addedName?: string }
  | { status: 'error'; message: string };

const imageSizeLimit = 6 * 1024 * 1024;

function scanErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function ImageIdentifier({ itemType, onAdd, suggestions = [] }: ImageIdentifierProps) {
  const { language, t } = useLanguage();
  const [scan, setScan] = useState<ScanState>({ status: 'idle' });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const isLivestock = itemType === 'livestock';
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  const label = t(isLivestock ? 'image.animal' : 'image.cropAnimal');
  const itemLabel = t(isLivestock ? 'image.pickAnimal' : 'image.pickCrop');

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function scanFile(file: File | undefined) {
    if (!file) return;
    if (file.size > imageSizeLimit) {
      setScan({ status: 'error', message: t('image.invalid') });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setShowManualEntry(false);
    setManualError(null);
    setScan({ status: 'scanning' });
    try {
      const result = await identifyFarmImage(file, itemType);
      // A confident match goes straight onto the list so the farmer does not have to retype it.
      if (result.status === 'identified' && result.itemName && onAddRef.current(result.itemName.trim())) {
        setScan({ status: 'result', result, addedName: result.itemName.trim() });
        return;
      }
      setScan({ status: 'result', result });
    } catch (error) {
      setScan({ status: 'error', message: scanErrorMessage(error, t('image.failed')) });
    }
  }

  function addName(name: string) {
    const normalized = name.trim();
    if (!normalized) {
      setManualError(t('image.nameRequired', { item: label }));
      return;
    }
    if (normalized.length > 60) {
      setManualError(t('image.nameTooLong'));
      setShowManualEntry(true);
      return;
    }
    if (!onAdd(normalized)) {
      setManualError(t('image.duplicate', { item: label }));
      setShowManualEntry(true);
      return;
    }
    setManualName('');
    setManualError(null);
    setShowManualEntry(false);
    setScan({ status: 'idle' });
    setPreviewUrl(null);
  }

  const result = scan.status === 'result' ? scan.result : null;
  const resultColor =
    result?.status === 'identified'
      ? 'border-leaf-300 bg-leaf-50 text-leaf-900'
      : result?.status === 'uncertain'
        ? 'border-amber-300 bg-amber-50 text-amber-950'
        : 'border-red-300 bg-red-50 text-red-950';
  const barColor =
    scan.status === 'scanning'
      ? 'scan-gradient'
      : result?.status === 'identified'
        ? 'bg-leaf-600'
        : result?.status === 'uncertain'
          ? 'bg-amber-500'
          : 'bg-red-600';

  return (
    <section className="rounded-2xl border border-soil-200 bg-white p-4" aria-label={t('image.region', { item: itemLabel })}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-soil-900">{t('image.scan')}</h3>
        </div>
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-leaf-700 px-4 text-sm font-semibold text-white transition hover:bg-leaf-800 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-leaf-500">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            aria-label={t(scan.status === 'idle' ? 'image.scanButton' : 'image.rescan')}
            onChange={(event) => {
              void scanFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          {t(scan.status === 'idle' ? 'image.scanButton' : 'image.rescan')}
        </label>
      </div>

      {previewUrl && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-soil-100 bg-soil-50 p-3">
          <img src={previewUrl} alt={itemLabel} className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div
              className="h-2 overflow-hidden rounded-full bg-soil-200"
              role="progressbar"
              aria-label={t('image.scan')}
              aria-valuetext={scan.status === 'scanning' ? t('image.analyzing') : result?.status ?? t('image.failed')}
            >
              <div
                className={`h-full rounded-full transition-colors ${barColor} ${
                  scan.status === 'scanning' ? 'scan-progress-indicator' : 'w-full'
                }`}
              />
            </div>
            {scan.status === 'scanning' && (
              <p className="mt-2 text-sm font-medium text-soil-700" role="status">
                {t('image.analyzing')}
              </p>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-3 rounded-xl border p-3 ${resultColor}`} aria-live="polite">
          {result.status === 'identified' && result.itemName ? (
            <>
              <p className="text-sm font-semibold">
                {t('image.identified', { name: translateFarmTerm(language, result.itemName) })}
              </p>
              <p className="mt-1 text-xs">{t('image.confidence', { percent: Math.round(result.confidence * 100) })}</p>
              {scan.status === 'result' && scan.addedName ? (
                <p className="mt-2 text-sm font-semibold">
                  {t('image.added', { name: translateFarmTerm(language, scan.addedName) })}
                </p>
              ) : (
                <Button className="mt-3" size="sm" onClick={() => addName(result.itemName ?? '')}>
                  {t('image.add', { item: label })}
                </Button>
              )}
            </>
          ) : result.status === 'uncertain' ? (
            <>
              <p className="text-sm font-semibold">{t('image.uncertain')}</p>
              <p className="mt-1 text-xs">{t('image.chooseMatch')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[result.itemName, ...result.alternatives]
                  .filter((name): name is string => Boolean(name))
                  .filter((name, index, names) => names.findIndex((candidate) => candidate.toLocaleLowerCase() === name.toLocaleLowerCase()) === index)
                  .map((name) => (
                    <Button key={name} size="sm" variant="secondary" onClick={() => addName(name)}>
                      {translateFarmTerm(language, name)}
                    </Button>
                  ))}
              </div>
              <p className="mt-2 text-xs">{t('image.confidence', { percent: Math.round(result.confidence * 100) })}</p>
            </>
          ) : (
            <p className="text-sm font-semibold">{t('image.unknown', { item: label })}</p>
          )}
        </div>
      )}

      {scan.status === 'error' && (
        <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {scan.message}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setShowManualEntry((shown) => !shown)}>
          {t(showManualEntry ? 'image.closeManual' : 'image.enterManually')}
        </Button>
      </div>

      {showManualEntry && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
          <TextField
            id={`manual-${itemType}`}
            label={t(isLivestock ? 'image.nameAnimal' : 'image.nameCrop')}
            placeholder={t(isLivestock ? 'image.animalExample' : 'image.cropExample')}
            list={`manual-${itemType}-suggestions`}
            value={manualName}
            onChange={(event) => {
              setManualName(event.target.value);
              setManualError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addName(manualName);
              }
            }}
            error={manualError ?? undefined}
            className="flex-1"
          />
          {suggestions.length > 0 && (
            <datalist id={`manual-${itemType}-suggestions`}>
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          )}
          <Button className="sm:mt-6" size="sm" onClick={() => addName(manualName)}>
            {t('image.addButton')}
          </Button>
        </div>
      )}
    </section>
  );
}
