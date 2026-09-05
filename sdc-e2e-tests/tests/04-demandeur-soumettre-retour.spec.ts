import { test } from '@playwright/test';
import * as path from 'path';
import { loginWithCredentials, buildCanvasAppPlayUrl, requiredEnv } from '../support/auth';
import { SdcCanvasAppPage } from '../pages/SdcCanvasAppPage';
import { Controls } from '../support/selectors';

/**
 * Rôle : Demandeur (compte SHAREPOINTTEST1 — variables/secrets Organization eFlip).
 * Golden path B.5, étape 4 : soumettre le retour de caisse avec justificatif.
 *
 * Couvre la régression A.3 : un rôle à personne fixe (Gestionnaire Caisse /
 * Directeur Financier) dans la liste des approbateurs du retour ne doit PAS
 * déclencher le faux message "champs obligatoires non remplis" corrigé plus tôt.
 */
test('Demandeur soumet le retour de caisse', async ({ page }) => {
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

  await app.goToOnglet('Mes demandes');
  await app.openCardByTitle(itemTitle);

  // Le bouton "Soumettre le retour" ne doit être visible QUE si Statut = "Approuvée"
  // (régression corrigée aujourd'hui — voir Shared_SortieCaisse.md).
  await app.byControl(Controls.btnSoumettreRetour).waitFor({ state: 'visible', timeout: 15_000 });
  await app.clickControl(Controls.btnSoumettreRetour);

  await app.fillControl(Controls.champMontantRetour, '500');
  await app.fillControl(Controls.champMontantRetourEnLettres, 'cinq cents');

  // Passer par le vrai flux `filechooser` (bouton "Joindre un fichier") plutôt que de
  // poser les fichiers directement sur l'<input> caché : sinon le fichier reste
  // "Unsaved"/disabled indéfiniment (constaté sur le formulaire de création, cf. 01).
  const piecesJointesRetourWrapper = app.byControl(Controls.piecesJointesRetour);
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    piecesJointesRetourWrapper.getByText('Joindre un fichier', { exact: true }).click(),
  ]);
  await fileChooser.setFiles(path.join(__dirname, '..', 'support', 'fixtures', 'justificatif-test.pdf'));

  await app.clickControl(Controls.btnEnvoyerRetour);

  // Régression A.3 : pas de faux message "champs obligatoires non remplis"
  await app.expectNoErrorNotification();
});
