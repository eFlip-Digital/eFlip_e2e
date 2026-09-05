import { test } from '@playwright/test';
import { loginWithCredentials, buildCanvasAppPlayUrl, requiredEnv } from '../support/auth';
import { SdcCanvasAppPage } from '../pages/SdcCanvasAppPage';

/**
 * Rôle : Directeur Financier (compte SHAREPOINTTEST2 — variables/secrets Organization eFlip).
 * Golden path B.5, étape 3 : confirmer le paiement.
 *
 * TODO à valider en conditions réelles (une fois les Environments/secrets prêts) :
 * l'ordre exact des étapes (Accusé vs Paiement, qui approuve le round "Demande")
 * doit être rejoué manuellement une première fois pour confirmer la séquence de
 * clics ci-dessous — voir Shared_SortieCaisse.md pour le détail des rounds
 * (EtapeApprobation 1→3 Demande, 4 Accusé, 5 Paiement, 6+ Retour).
 */
test('Directeur Financier confirme le paiement', async ({ page }) => {
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
  await app.clickControl('btnConfirmPaiement');

  await app.expectNoErrorNotification();
  console.log(`SDC_ITEM_TITLE=${itemTitle}`);
});
