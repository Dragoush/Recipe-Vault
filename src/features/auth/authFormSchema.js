import { z } from 'zod';

const VALIDATION_MESSAGES = {
  usernameTooShort: 'Username must have at least 3 characters.',
  usernameTooLong: 'Username must stay under 32 characters.',
  usernameInvalid:
    'Username may contain only letters, numbers, and underscores.',
  passwordTooShort: 'Password must have at least 8 characters.',
  passwordTooLong: 'Password must stay under 128 characters.',
  passwordMismatch: 'Passwords must match.'
};

export const loginDefaultValues = {
  username: '',
  password: ''
};

export const registerDefaultValues = {
  username: '',
  password: '',
  confirmPassword: ''
};

export const authUsernameSchema = z
  .string()
  .trim()
  .min(3, VALIDATION_MESSAGES.usernameTooShort)
  .max(32, VALIDATION_MESSAGES.usernameTooLong)
  .regex(
    /^[A-Za-z0-9_]+$/,
    VALIDATION_MESSAGES.usernameInvalid
  );

export const authPasswordSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.passwordTooShort)
  .max(128, VALIDATION_MESSAGES.passwordTooLong);

export const loginFormSchema = z.object({
  username: authUsernameSchema,
  password: authPasswordSchema
});

export const registerFormSchema = z
  .object({
    username: authUsernameSchema,
    password: authPasswordSchema,
    confirmPassword: authPasswordSchema
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: VALIDATION_MESSAGES.passwordMismatch,
    path: ['confirmPassword']
  });

export function toAuthRequestPayload(values) {
  return {
    username: values.username.trim(),
    password: values.password
  };
}
