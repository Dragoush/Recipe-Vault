import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

function resolveWorkspaceFile(filePath) {
  return resolve(process.cwd(), filePath);
}

function createHttpsConfig(env) {
  if (env.VITE_HTTPS !== 'true') {
    return undefined;
  }

  if (!env.VITE_SSL_KEY_FILE || !env.VITE_SSL_CERT_FILE) {
    throw new Error(
      'VITE_HTTPS=true requires both VITE_SSL_KEY_FILE and VITE_SSL_CERT_FILE.'
    );
  }

  return {
    key: readFileSync(resolveWorkspaceFile(env.VITE_SSL_KEY_FILE)),
    cert: readFileSync(resolveWorkspaceFile(env.VITE_SSL_CERT_FILE))
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const httpsConfig = createHttpsConfig(env);

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      https: httpsConfig
    },
    preview: {
      host: '0.0.0.0',
      https: httpsConfig
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.js',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/main.jsx', 'src/test/**/*.{js,jsx}']
      }
    }
  };
});
