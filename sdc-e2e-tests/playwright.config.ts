import { defineConfig, devices } from '@playwright/test';

/**
 * Un seul worker : les scénarios s'exécutent en séquence sur la MÊME demande
 * (créée par le rôle Demandeur, puis reprise par les rôles suivants).
 * Ne pas paralléliser les fichiers de test tant que ce couplage existe.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
