import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import { registerDefaultValues, registerFormSchema } from './authFormSchema';
import useAuth from './useAuth';

const REGISTER_SUCCESS_NOTICE = 'Account created. Sign in to access your recipes.';

const REGISTER_COPY = {
  title: 'Create your account',
  submitLabel: 'Register',
  footerPrompt: 'Already have an account?',
  footerLinkLabel: 'Log in',
  footerLinkTo: '/login',
  submitErrorFallback: 'Unable to create your account right now.',
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
      autoComplete: 'new-password',
      type: 'password',
      hideLabel: true
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      placeholder: 'Confirm password',
      autoComplete: 'new-password',
      type: 'password',
      hideLabel: true
    }
  ]
};

export default function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  async function handleSubmit(values) {
    setSubmitError('');

    try {
      await auth.register(values);
      navigate('/login', {
        replace: true,
        state: {
          notice: REGISTER_SUCCESS_NOTICE
        }
      });
    } catch (error) {
      setSubmitError(error?.message ?? REGISTER_COPY.submitErrorFallback);
    }
  }

  return (
    <div className="auth-page-shell">
      <section className="auth-card panel">
        <div className="auth-card-header">
          <h1 className="auth-card-title">{REGISTER_COPY.title}</h1>
        </div>

        <AuthForm
          defaultValues={registerDefaultValues}
          fields={REGISTER_COPY.fields}
          footerLinkLabel={REGISTER_COPY.footerLinkLabel}
          footerLinkTo={REGISTER_COPY.footerLinkTo}
          footerPrompt={REGISTER_COPY.footerPrompt}
          formSchema={registerFormSchema}
          onSubmit={handleSubmit}
          submitError={submitError}
          submitLabel={REGISTER_COPY.submitLabel}
        />
      </section>
    </div>
  );
}
