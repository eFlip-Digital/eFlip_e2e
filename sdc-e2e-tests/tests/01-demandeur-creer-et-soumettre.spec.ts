import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { loginWithCredentials, buildCanvasAppPlayUrl, requiredEnv } from '../support/auth';
import { SdcCanvasAppPage } from '../pages/SdcCanvasAppPage';
import { Controls } from '../support/selectors';

/**
 * Rôle : Demandeur (compte SHAREPOINTTEST1 — variables/secrets Organization eFlip).
 *
 * Scénario B.5 (golden path, étape 1) :
 *   Créer une demande, la soumettre, vérifier qu'elle apparaît "Soumis" dans la galerie
 *   et qu'aucune erreur de validation des approbateurs ne remonte (régression A.3/A.4).
 *
 * Écrit le titre de la demande créée dans test-results/current-item.txt ET sur stdout
 * (ligne `SDC_ITEM_TITLE=...`) pour que le job CI suivant le récupère en output.
 */
test('Demandeur crée et soumet une nouvelle demande de sortie de caisse', async ({ page }) => {
  const envId = requiredEnv('POWERPLATFORM_ENV_ID');
  const appId = requiredEnv('POWERPLATFORM_APP_ID');
  const email = requiredEnv('SDC_TEST_EMAIL');
  const password = requiredEnv('SDC_TEST_PASSWORD');

  const itemTitle = `E2E_${new Date().toISOString().replace(/[:.]/g, '-')}`;

  await page.goto(buildCanvasAppPlayUrl(envId, appId));
  await loginWithCredentials(page, email, password);

  const app = new SdcCanvasAppPage(page);
  await app.waitForLoad();
  await app.dismissBanners();

  await app.goToOnglet('Mes demandes');
  await app.openNewRequestForm();

  await app.selectDemandeur(email);
  await app.byControl(Controls.champTitre).fill(itemTitle);
  await app.byControl(Controls.champMontant).fill('1000');
  await app.byControl(Controls.champMontantEnLettre).fill('mille');
  await app.byControl(Controls.champMotif).fill('Test end-to-end automatisé — ne pas traiter');

  await app.clickControl(Controls.formSaveOrEdit);

  // Soumission de la demande (round "Demande")
  await app.openCardByTitle(itemTitle);
  await app.clickControl(Controls.btnSoumettreDemande);

  // Régression A.3/A.4 : pas de message d'erreur de validation des approbateurs
  await app.expectNoErrorNotification();

  await expect
    .poll(() => app.getStatutOnCard(itemTitle), { timeout: 30_000 })
    .toMatch(/Soumis/i);

  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/current-item.txt', itemTitle);
  console.log(`SDC_ITEM_TITLE=${itemTitle}`);
});
