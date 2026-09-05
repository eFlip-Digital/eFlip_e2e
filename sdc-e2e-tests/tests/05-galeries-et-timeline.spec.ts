import { test, expect } from '@playwright/test';
import { loginWithCredentials, buildCanvasAppPlayUrl, requiredEnv } from '../support/auth';
import { SdcCanvasAppPage } from '../pages/SdcCanvasAppPage';
import { Controls } from '../support/selectors';

/**
 * Rôle : Demandeur (compte SHAREPOINTTEST1) — dernier job de la chaîne.
 *
 * Couvre les régressions C.6 / C.7 / A.2 :
 *   - la demande reste visible dans "Mes demandes" après validation finale
 *   - la timeline affiche une icône sur chaque étape, pas seulement l'étape courante
 */
test('La demande reste visible et la timeline affiche une icône à chaque étape', async ({ page }) => {
  const envId = requiredEnv('POWERPLATFORM_ENV_ID');
  const appId = requiredEnv('POWERPLATFORM_APP_ID');
  const email = requiredEnv('SDC_TEST_EMAIL');
  const password = requiredEnv('SDC_TEST_PASSWORD');
  const itemTitle = requiredEnv('SDC_ITEM_TITLE');

  await page.goto(buildCanvasAppPlayUrl(envId, appId));
  await loginWithCredentials(page, email, password);

  const app = new SdcCanvasAppPage(page);
  await app.waitForLoad();
  await app.dismissBanners();

  // Régression C.6 : toujours visible dans "Mes demandes" après traitement complet.
  await app.goToOnglet('Mes demandes');
  await app.openCardByTitle(itemTitle); // échoue si la carte a disparu de la galerie

  // Régression A.2 : icône sur chaque étape de la timeline (pas seulement l'étape en cours).
  const timelineSteps = app.byControl(Controls.galerieTimeline).locator('[data-control-part="gallery-item"]');
  const stepCount = await timelineSteps.count();
  expect(stepCount).toBeGreaterThan(0);

  for (let i = 0; i < stepCount; i++) {
    const step = timelineSteps.nth(i);
    const hasIcon = await step.locator('svg, img, [data-control-name*="Icon"]').count();
    expect(hasIcon, `Étape ${i} de la timeline sans icône`).toBeGreaterThan(0);
  }
});
