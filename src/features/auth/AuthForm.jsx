import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

const FIELD_ID_PREFIX = 'auth';

function FieldError({ error }) {
  return error ? (
    <p className="field-error" role="alert">
      {error.message}
    </p>
  ) : null;
}

export default function AuthForm({
  defaultValues,
  fields,
  footerLinkLabel,
  footerLinkTo,
  footerPrompt,
  formSchema,
  onSubmit,
  submitError = '',
  submitLabel
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field) => {
        const fieldId = `${FIELD_ID_PREFIX}-${field.name}`;

        return (
          <div className="field" key={field.name}>
            <label
              className={field.hideLabel ? 'sr-only' : undefined}
              htmlFor={fieldId}
            >
              {field.label}
            </label>
            <input
              id={fieldId}
              {...register(field.name)}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              type={field.type}
            />
            <FieldError error={errors[field.name]} />
          </div>
        );
      })}

      {submitError ? (
        <p className="field-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="form-actions auth-form-actions">
        <button className="button" disabled={isSubmitting} type="submit">
          {submitLabel}
        </button>
      </div>

      <p className="auth-form-footer">
        {footerPrompt}{' '}
        <Link className="inline-link" to={footerLinkTo}>
          {footerLinkLabel}
        </Link>
      </p>
    </form>
  );
}
