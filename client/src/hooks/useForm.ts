import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { FieldErrors } from '../utils/validation';

interface UseFormOptions<T extends object> {
  initialValues: T;
  validate: (values: T) => FieldErrors<T>;
  onSubmit: (values: T) => Promise<void>;
  /** Turns an error thrown by onSubmit into a message for the user. */
  getErrorMessage: (error: unknown) => string;
}

/** Form state, field validation and submit handling shared by all forms. */
export function useForm<T extends object>({
  initialValues,
  validate,
  onSubmit,
  getErrorMessage,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Sets any field directly, for inputs that are not plain text (lists, maps, map pins). */
  function setFieldValue<K extends keyof T>(field: K, value: T[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear a field's error as soon as the user edits it.
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  /** onChange handler for text inputs whose `name` matches a string field of T. */
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return { values, errors, formError, isSubmitting, handleChange, setFieldValue, handleSubmit };
}
