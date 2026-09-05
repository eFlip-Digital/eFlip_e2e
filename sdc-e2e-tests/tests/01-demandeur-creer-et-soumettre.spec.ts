import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
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
  // Terme de recherche pour le combo Demandeur : le connecteur Office365Users matche
  // le NOM D'AFFICHAGE ("Sharepoint1 TEST"), pas l'email — voir support/selectors.ts
  // pour la correspondance email -> nom d'affichage des 4 comptes de test.
  const displayNameSearch = requiredEnv('SDC_TEST_DISPLAY_NAME_SEARCH');

  const itemTitle = `E2E_${new Date().toISOString().replace(/[:.]/g, '-')}`;

  await page.goto(buildCanvasAppPlayUrl(envId, appId));
  await loginWithCredentials(page, email, password);

  const app = new SdcCanvasAppPage(page);
  await app.waitForLoad();
  await app.dismissBanners();

  await app.goToOnglet('Mes demandes');
  await app.openNewRequestForm();

  await app.selectDemandeur(displayNameSearch);
  await app.fillControl(Controls.champTitre, itemTitle);
  await app.fillControl(Controls.champMontant, '1000');
  await app.fillControl(Controls.champMontantEnLettre, 'mille');
  await app.fillControl(Controls.champMotif, 'Test end-to-end automatisé — ne pas traiter');

  // Justificatifs obligatoire à la création (astérisque rouge sur "Justificatifs *"),
  // sinon le formulaire refuse de s'enregistrer silencieusement (modale reste ouverte).
  const piecesJointesWrapper = app.byControl(Controls.piecesJointesDemande);
  await app.scrollModalUntilVisible(piecesJointesWrapper);
  const fileInput = piecesJointesWrapper.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(__dirname, '..', 'support', 'fixtures', 'justificatif-test.pdf'));
  // Laisse le contrôle Attachments finir d'enregistrer le fichier côté état interne
  // avant de cliquer Enregistrer (sinon la validation du formulaire peut s'exécuter
  // sur un état encore vide et refuser silencieusement de sauvegarder).
  await app.frame.getByText('justificatif-test.pdf').first().waitFor({ state: 'visible', timeout: 10_000 });
  // Le fichier reste marqué "Unsaved" (bouton désactivé) tant que l'upload interne
  // n'est pas terminé — cliquer Enregistrer pendant ce temps échoue silencieusement
  // (la modale reste ouverte, sans message d'erreur visible).
  await app.frame.getByText('Unsaved', { exact: true }).waitFor({ state: 'hidden', timeout: 20_000 });

  await app.clickControl(Controls.formSaveOrEdit);

  // La modale doit se fermer (le titre "Nouvelle demande..." disparaît) si
  // l'enregistrement a réellement réussi — sinon erreur explicite ici plutôt qu'un
  // timeout générique plus loin sur "carte introuvable".
  await app.frame
    .getByText('Nouvelle demande de sortie de caisse', { exact: true })
    .waitFor({ state: 'hidden', timeout: 20_000 });

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
