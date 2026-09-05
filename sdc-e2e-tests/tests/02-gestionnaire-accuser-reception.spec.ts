import { test, expect } from '@playwright/test';
import { loginWithCredentials, buildCanvasAppPlayUrl, requiredEnv } from '../support/auth';
import { SdcCanvasAppPage } from '../pages/SdcCanvasAppPage';
import { TextLabels } from '../support/selectors';

/**
 * Rôle : Gestionnaire Caisse (compte ADMIN2 — variables/secrets Organization eFlip).
 *
 * Scénario A.1 (régression, étape 2) + B.5 (golden path, étape 2) :
 *   Accuser réception de la demande créée par le job précédent, PUIS NE PAS soumettre
 *   de retour. Le scénario A.1 complet se termine dans le test suivant (05) qui vérifie
 *   le statut final = "Approuvée" sans étape Retour dans la timeline.
 *
 * Attend SDC_ITEM_TITLE en entrée (fourni par le job précédent via GitHub Actions
 * `needs.*.outputs` ou, en local, lu depuis test-results/current-item.txt).
 */
test('Gestionnaire Caisse accuse réception de la demande', async ({ page }) => {
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

  await app.goToOnglet('Mes validations');
  await app.openCardByTitle(itemTitle);

  await app.clickControl('btnAccuseReceptionSDC');
  await app.clickControl('btnSendRetour_1'); // bouton "Envoyer" de la modale Accusé

  await app.expectNoErrorNotification();

  await expect
    .poll(() => app.getStatutOnCard(itemTitle), { timeout: 30_000 })
    .not.toMatch(/En attente/i);

  console.log(`SDC_ITEM_TITLE=${itemTitle}`);
});
