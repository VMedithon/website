import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';

// Browser tests simulate identity. This config is never used by the website build.
export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      alias: { '@clerk/react': fileURLToPath(new URL('./tests/clerk-stub.tsx', import.meta.url)) },
    },
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify('pk_test_browser_fixture'),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:4174'),
    },
  }),
);
