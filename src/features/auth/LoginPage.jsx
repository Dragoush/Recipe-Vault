import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import { loginDefaultValues, loginFormSchema } from './authFormSchema';
import useAuth from './useAuth';

const LOGIN_COPY = {
  title: 'Welcome back!',
  submitLabel: 'Login',
  footerPrompt: "Don't have an account?",
  footerLinkLabel: 'Register now',
  footerLinkTo: '/register',
  submitErrorFallback: 'Unable to sign in right now.',
  fields: [
    {
      name: 'username',
      label: 'Username',
      placeholder: 'Username',
      autoComplete: 'username',
      type: 'text',
      hideLabel: true
    },
    {
      name: 'password',
      label: 'Password',
      placeholder: 'Password',
      autoComplete: 'current-password',
      type: 'password',
      hideLabel: true
    }
  ]
};

export default function LoginPage() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const fromPath = location.state?.from?.pathname ?? '/recipes';
  const pageNotice = location.state?.notice ?? '';
  const notice = useMemo(
    () => auth.notice || pageNotice,
    [auth.notice, pageNotice]
  );

  async function handleSubmit(values) {
    setSubmitError('');

    try {
      await auth.login(values);
      auth.clearNotice();
      navigate(fromPath, { replace: true });
    } catch (error) {
      setSubmitError(error?.message ?? LOGIN_COPY.submitErrorFallback);
    }
  }

  return (
    <div className="auth-page-shell">
      {notice ? (
        <section className="panel auth-notice-panel">
          <p className="auth-notice-copy">{notice}</p>
        </section>
      ) : null}

      <section className="auth-card panel">
        <div className="auth-card-header">
          <h1 className="auth-card-title">{LOGIN_COPY.title}</h1>
        </div>

        <AuthForm
          defaultValues={loginDefaultValues}
          fields={LOGIN_COPY.fields}
          footerLinkLabel={LOGIN_COPY.footerLinkLabel}
          footerLinkTo={LOGIN_COPY.footerLinkTo}
          footerPrompt={LOGIN_COPY.footerPrompt}
          formSchema={loginFormSchema}
          onSubmit={handleSubmit}
          submitError={submitError}
          submitLabel={LOGIN_COPY.submitLabel}
        />
      </section>
    </div>
  );
}
