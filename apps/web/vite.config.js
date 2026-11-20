import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  const port = Number(process.env.PORT || loadEnv(mode, workspaceRoot, '').PORT || 5000);
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': `http://127.0.0.1:${port}`,
        '/uploads': `http://127.0.0.1:${port}`,
      },
    },
  };
});
