import { test } from '@playwright/test';
import { loginWithCredentials, buildCanvasAppPlayUrl, requiredEnv } from '../support/auth';

/**
 * Test utilitaire (PAS une régression) : liste tous les `data-control-name` visibles
 * sur l'écran d'accueil, pour finaliser support/selectors.ts. À lancer une fois en
 * local (`npx playwright test 00-discover`), lire la sortie console / le rapport,
 * puis reporter les vrais noms dans selectors.ts avant d'activer les autres specs.
 */
test('découverte des data-control-name (accueil)', async ({ page }) => {
  const envId = requiredEnv('POWERPLATFORM_ENV_ID');
  const appId = requiredEnv('POWERPLATFORM_APP_ID');
  const email = requiredEnv('SDC_TEST_EMAIL');
  const password = requiredEnv('SDC_TEST_PASSWORD');

  await page.goto(buildCanvasAppPlayUrl(envId, appId));
  await loginWithCredentials(page, email, password);

  const frame = page.frameLocator('iframe[name="fullscreen-app-host"]');
  await frame.locator('[data-control-part="gallery-item"]').first().waitFor({ timeout: 60_000 });

  const names = await frame.locator('[data-control-name]').evaluateAll((els) =>
    [...new Set(els.map((el) => el.getAttribute('data-control-name')))].sort()
  );

  console.log('=== data-control-name trouvés sur l\'écran d\'accueil ===');
  console.log(JSON.stringify(names, null, 2));

  await page.screenshot({ path: 'test-results/00-discover-home.png', fullPage: true });
});
