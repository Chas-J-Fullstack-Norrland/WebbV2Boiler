import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // gives access to document, window, cookies, etc.
    globals: true,         // allows using expect, describe, it without importing
  },
});