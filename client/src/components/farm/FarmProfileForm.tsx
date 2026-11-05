import { useState } from 'react';
import { CROPS } from '../../../../config/knowledge-base/crops';
import { LIVESTOCK } from '../../../../config/knowledge-base/livestock';
import { FARM_LIMITS } from '../../utils/validation';
import { useForm } from '../../hooks/useForm';
import type { FarmFormValues, FarmLocation } from '../../types/farm';
import { ACRES_PER_HECTARE, formatCoordinate, prepareFarmPhoto } from '../../utils/farmForm';
import { getCropLabel } from '../../utils/farmLabels';
import { getCurrentLocation } from '../../utils/geolocation';
import { validateFarm } from '../../utils/validation';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { FormSection } from '../ui/FormSection';
import { TextField } from '../ui/TextField';
import { ImageIdentifier } from './ImageIdentifier';
import { LocationPicker } from './LocationPicker';
import { PlotSurvey } from './PlotSurvey';
import { useLanguage } from '../../hooks/useLanguage';
import { translateFarmTerm } from '../../i18n';

interface FarmProfileFormProps {
  initialValues: FarmFormValues;
  isNew: boolean;
  onSubmit: (values: FarmFormValues) => Promise<void>;
  getErrorMessage: (error: unknown) => string;
}

type AreaUnit = 'acres' | 'hectares';

function convertArea(value: string, from: AreaUnit, to: AreaUnit): string {
  const numericValue = Number(value);
  if (!value.trim() || !Number.isFinite(numericValue) || from === to) return value;
  const converted = from === 'hectares'
    ? numericValue * ACRES_PER_HECTARE
    : numericValue / ACRES_PER_HECTARE;
  return converted.toFixed(2);
}

function normalizeFarmFormValues(values: FarmFormValues, areaUnit: AreaUnit): FarmFormValues {
  return {
    ...values,
    locationName: values.locationName.trim() || values.name.trim(),
    sizeHectares: areaUnit === 'acres' && values.sizeHectares.trim()
      ? String(Number(values.sizeHectares) / ACRES_PER_HECTARE)
      : values.sizeHectares,
  };
}

/** Returns the location typed or picked so far, or null while it is incomplete or invalid. */
function parseLocation(latitude: string, longitude: string): FarmLocation | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { latitude: lat, longitude: lng };
}

export function FarmProfileForm({ initialValues, isNew, onSubmit, getErrorMessage }: FarmProfileFormProps) {
  const { language, t } = useLanguage();
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('acres');
  const { values, errors, formError, isSubmitting, handleChange, setFieldValue, handleSubmit } = useForm({
    initialValues: {
      ...initialValues,
      sizeHectares: convertArea(initialValues.sizeHectares, 'hectares', areaUnit),
    },
    validate: (formValues) => validateFarm(normalizeFarmFormValues(formValues, areaUnit)),
    onSubmit: (formValues) => onSubmit(normalizeFarmFormValues(formValues, areaUnit)),
    getErrorMessage,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const location = parseLocation(values.latitude, values.longitude);
  const livestockEntries = Object.entries(values.livestock);

  function setLocation({ latitude, longitude }: FarmLocation) {
    setFieldValue('latitude', formatCoordinate(latitude));
    setFieldValue('longitude', formatCoordinate(longitude));
  }

  async function handleUseMyLocation() {
    setIsLocating(true);
    setLocateError(null);
    try {
      setLocation(await getCurrentLocation());
    } catch (error) {
      setLocateError(error instanceof Error ? error.message : 'Your location could not be found.');
    } finally {
      setIsLocating(false);
    }
  }

  async function handleFarmPhotoChange(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    if (file.size > 12 * 1024 * 1024) {
      setPhotoError(t('farm.photoTooLarge'));
      return;
    }
    try {
      setFieldValue('photoDataUrl', await prepareFarmPhoto(file));
    } catch {
      setPhotoError(t('farm.photoFailed'));
    }
  }

  function addCropName(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > FARM_LIMITS.maxCropNameLength) return false;
    const catalogueCrop = CROPS.find(
      (crop) => crop.id.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
        || crop.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    );
    const cropName = catalogueCrop?.id ?? trimmed;
    if (values.crops.some((crop) => crop.toLocaleLowerCase() === cropName.toLocaleLowerCase())) return false;
    if (values.crops.length >= FARM_LIMITS.maxCrops) return false;
    setFieldValue('crops', [...values.crops, cropName]);
    return true;
  }

  function addLivestockName(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > FARM_LIMITS.maxCropNameLength) return false;
    const catalogueAnimal = LIVESTOCK.find(
      (animal) => animal.id.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
        || animal.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    );
    const normalizedName = catalogueAnimal?.id ?? trimmed.replace(/\s+/g, ' ');
    const alreadyExists = Object.keys(values.livestock).some(
      (animal) => animal.toLocaleLowerCase() === normalizedName.toLocaleLowerCase(),
    );
    if (alreadyExists) return false;
    setFieldValue('livestock', { ...values.livestock, [normalizedName]: values.livestock[normalizedName] ?? '' });
    return true;
  }

  function removeCrop(name: string) {
    setFieldValue('crops', values.crops.filter((crop) => crop !== name));
  }

  function removeLivestock(id: string) {
    const nextLivestock = { ...values.livestock };
    delete nextLivestock[id];
    setFieldValue('livestock', nextLivestock);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && <Alert tone="error">{formError}</Alert>}

      <section className="relative isolate flex flex-col gap-4 overflow-hidden rounded-2xl border border-leaf-200 bg-gradient-to-br from-leaf-50 via-white to-wheat-50 p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
        <div className="absolute -right-10 -top-12 -z-10 h-36 w-36 rounded-full bg-citrus-300/20 blur-2xl" aria-hidden="true" />
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-leaf-100 shadow-md ring-1 ring-leaf-200">
          {values.photoDataUrl ? (
            <img src={values.photoDataUrl} alt={t('farm.photo')} className="h-full w-full object-cover" />
          ) : (
            <>
              <img src="/farm-hero.jpg" alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-end bg-gradient-to-t from-leaf-950/75 via-transparent to-transparent p-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white drop-shadow" fill="none" aria-hidden="true">
                  <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-leaf-900">{t('farm.photo')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl bg-leaf-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-leaf-800 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-leaf-500">
              {t('farm.choosePhoto')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label={t('farm.choosePhoto')}
                onChange={(event) => {
                  void handleFarmPhotoChange(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </label>
            {values.photoDataUrl && (
              <Button variant="secondary" size="sm" onClick={() => setFieldValue('photoDataUrl', null)}>
                {t('farm.removePhoto')}
              </Button>
            )}
          </div>
          {photoError && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{photoError}</p>}
        </div>
      </section>

      <FormSection title={t('farm.details')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="name"
            name="name"
            label={t('farm.name')}
            placeholder={t('farm.nameExample')}
            value={values.name}
            onChange={handleChange}
            error={errors.name}
          />
          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <TextField
              id="sizeHectares"
              name="sizeHectares"
              type="number"
              inputMode="decimal"
              min="0"
              step={areaUnit === 'acres' ? '0.01' : '0.1'}
              label={t(areaUnit === 'acres' ? 'farm.sizeAcres' : 'farm.size')}
              value={values.sizeHectares}
              onChange={handleChange}
              error={errors.sizeHectares}
            />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-soil-800">
              <span>{t('farm.areaUnit')}</span>
              <select
                value={areaUnit}
                onChange={(event) => {
                  const nextUnit = event.target.value === 'hectares' ? 'hectares' : 'acres';
                  setFieldValue('sizeHectares', convertArea(values.sizeHectares, areaUnit, nextUnit));
                  setAreaUnit(nextUnit);
                }}
                className="min-h-11 rounded-xl border border-soil-300 bg-white px-3 text-soil-900 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              >
                <option value="acres">{t('farm.acres')}</option>
                <option value="hectares">{t('farm.hectares')}</option>
              </select>
            </label>
          </div>
        </div>
        <PlotSurvey
          onMeasure={(measurement) => setFieldValue(
            'sizeHectares',
            convertArea(String(measurement.areaHectares), 'hectares', areaUnit),
          )}
        />
      </FormSection>

      <FormSection title={t('farm.location')}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={handleUseMyLocation} isLoading={isLocating}>
            {t('farm.useLocation')}
          </Button>
        </div>
        {locateError && <Alert tone="warning">{locateError}</Alert>}
        <LocationPicker value={location} onChange={setLocation} />
        {(errors.latitude || errors.longitude) && (
          <p className="text-sm font-medium text-red-700" role="alert">{errors.latitude ?? errors.longitude}</p>
        )}
      </FormSection>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <FormSection title={t('farm.cropsProducts')}>
          <ImageIdentifier
            itemType="crop_product"
            onAdd={addCropName}
            suggestions={CROPS.map((crop) => crop.label)}
          />

          {values.crops.length > 0 && (
            <ul className="space-y-2" aria-label={t('farm.cropsList')}>
              {values.crops.map((crop) => (
                <li key={crop} className="flex items-center justify-between gap-3 rounded-xl border border-leaf-100 bg-gradient-to-r from-white to-leaf-50/80 px-3 py-2 transition-transform duration-200 hover:-translate-y-0.5">
                  <span className="text-sm font-semibold text-leaf-900">
                    {translateFarmTerm(language, getCropLabel(crop))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCrop(crop)}
                    className="min-h-9 rounded-md px-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    aria-label={t('farm.removeNamed', { name: crop })}
                  >
                    {t('farm.remove')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.crops && <p className="text-xs font-medium text-red-700">{errors.crops}</p>}
        </FormSection>

        <FormSection title={t('farm.livestock')}>
          <ImageIdentifier
            itemType="livestock"
            onAdd={addLivestockName}
            suggestions={LIVESTOCK.map((animal) => animal.label)}
          />

          {livestockEntries.length > 0 && (
            <ul className="space-y-3" aria-label={t('farm.livestockList')}>
              {livestockEntries.map(([id, count]) => {
                const name = translateFarmTerm(language, LIVESTOCK.find((animal) => animal.id === id)?.label ?? id);
                return (
                  <li key={id} className="flex flex-wrap items-end gap-3 rounded-xl border border-wheat-200 bg-gradient-to-r from-white to-wheat-50 p-3 transition-transform duration-200 hover:-translate-y-0.5">
                    <span className="min-w-32 flex-1 pb-2 text-sm font-semibold text-soil-800">{name}</span>
                    <TextField
                      id={`livestock-${id}`}
                      label={t('farm.numberKept')}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={count}
                      onChange={(event) =>
                        setFieldValue('livestock', { ...values.livestock, [id]: event.target.value })
                      }
                      className="w-full sm:w-40"
                    />
                    <button
                      type="button"
                      onClick={() => removeLivestock(id)}
                      className="min-h-11 rounded-md px-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      aria-label={t('farm.removeNamed', { name })}
                    >
                      {t('farm.remove')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {errors.livestock && <p className="text-xs font-medium text-red-700">{errors.livestock}</p>}
        </FormSection>
      </div>

      <div className="border-t border-soil-100 pt-6">
        <Button type="submit" isLoading={isSubmitting} fullWidth>
          {isNew ? t('farm.save') : t('farm.saveChanges')}
        </Button>
      </div>
    </form>
  );
}
