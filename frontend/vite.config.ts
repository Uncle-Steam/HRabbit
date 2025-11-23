import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      root: '.',
      build: {
        rollupOptions: {
          input: './index.html'
        }
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Gemini API (for video transcription only)
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        // IBM Watsonx Orchestrate API (primary backend)
        'process.env.WATSONX_API_ENDPOINT': JSON.stringify(env.WATSONX_API_ENDPOINT || env.WATSONX_ORCHESTRATE_ENDPOINT || ''),
        'process.env.WATSONX_ORCHESTRATE_ENDPOINT': JSON.stringify(env.WATSONX_ORCHESTRATE_ENDPOINT || env.WATSONX_API_ENDPOINT || ''),
        'process.env.WATSONX_API_KEY': JSON.stringify(env.WATSONX_API_KEY || env.WATSONX_ORCHESTRATE_API_KEY || ''),
        'process.env.WATSONX_ORCHESTRATE_API_KEY': JSON.stringify(env.WATSONX_ORCHESTRATE_API_KEY || env.WATSONX_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
