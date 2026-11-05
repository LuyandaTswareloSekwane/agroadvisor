import { Link, useLocation } from 'react-router';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import { getAuthErrorMessage } from '../services/authService';
import type { RegisterFormValues } from '../types/auth';
import { PASSWORD_MIN_LENGTH, validateRegister } from '../utils/validation';
import { useLanguage } from '../hooks/useLanguage';

const initialValues: RegisterFormValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const { values, errors, formError, isSubmitting, handleChange, handleSubmit } = useForm({
    initialValues,
    validate: validateRegister,
    onSubmit: ({ fullName, email, password }) =>
      register({ fullName: fullName.trim(), email: email.trim(), password }),
    getErrorMessage: getAuthErrorMessage,
  });

  return (
    <AuthFormCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" state={location.state} className="font-semibold text-leaf-700 underline">
            {t('auth.login')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <TextField
          id="fullName"
          name="fullName"
          appearance="auth"
          label={t('auth.fullName')}
          autoComplete="name"
          value={values.fullName}
          onChange={handleChange}
          error={errors.fullName}
        />
        <TextField
          id="email"
          name="email"
          type="email"
          appearance="auth"
          label={t('auth.email')}
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextField
          id="password"
          name="password"
          type="password"
          appearance="auth"
          label={t('auth.password')}
          autoComplete="new-password"
          hint={t('auth.passwordHint', { count: PASSWORD_MIN_LENGTH })}
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <TextField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          appearance="auth"
          label={t('auth.confirmPassword')}
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {t('auth.createAccount')}
        </Button>
      </form>
    </AuthFormCard>
  );
}
