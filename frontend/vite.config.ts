import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '..');

export default defineConfig(({ mode }) => {
  const environment = {
    ...loadEnv(mode, repositoryRoot, ''),
    ...process.env,
  };

  return {
    envDir: repositoryRoot,
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        environment.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
      ),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
        environment.VITE_GOOGLE_CLIENT_ID ?? environment.GOOGLE_CLIENT_ID ?? '',
      ),
    },
  };
});
