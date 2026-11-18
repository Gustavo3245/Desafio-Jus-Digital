import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');

  return {
    root: 'tools/manual-test',
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
    define: {
      __GOOGLE_CLIENT_ID__: JSON.stringify(environment.GOOGLE_CLIENT_ID ?? ''),
      __API_BASE_URL__: JSON.stringify(
        environment.MANUAL_API_URL ?? 'http://localhost:3000/api/v1',
      ),
    },
  };
});
