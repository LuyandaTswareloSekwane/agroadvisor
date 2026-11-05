import { Link, useLocation } from 'react-router';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import { getAuthErrorMessage } from '../services/authService';
import type { LoginInput } from '../types/auth';
import { validateLogin } from '../utils/validation';
import { useLanguage } from '../hooks/useLanguage';

const initialValues: LoginInput = { email: '', password: '' };

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  // Keep the page the farmer was trying to reach when switching to registration.
  const location = useLocation();
  const { values, errors, formError, isSubmitting, handleChange, handleSubmit } = useForm({
    initialValues,
    validate: validateLogin,
    onSubmit: ({ email, password }) => login({ email: email.trim(), password }),
    getErrorMessage: getAuthErrorMessage,
  });

  return (
    <AuthFormCard
      title={t('auth.welcome')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.newUser')}{' '}
          <Link to="/register" state={location.state} className="font-semibold text-leaf-700 underline">
            {t('auth.createAccountLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
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
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {t('auth.login')}
        </Button>
      </form>
    </AuthFormCard>
  );
}
