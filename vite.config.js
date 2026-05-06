import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NETLIFY ? '/' : '/iesgroup.it/',
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
