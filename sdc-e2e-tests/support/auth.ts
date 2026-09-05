import { Page } from '@playwright/test';

/**
 * Connexion via le formulaire de login Microsoft standard (login.microsoftonline.com).
 * Volontairement PAS de device-code / az-cli : ce flux web classique est celui qui,
 * dans ce tenant, passe la politique d'Accès conditionnel qui bloque l'app "Microsoft
 * Azure CLI" pour certains comptes (voir Shared_SortieCaisse.md). Si un compte de test
 * a la MFA active, ce login échouera en headless — les comptes de test doivent en être
 * exemptés.
 */
export async function loginWithCredentials(page: Page, email: string, password: string): Promise<void> {
  // Champ email
  const emailInput = page.locator('input[type="email"], input[name="loginfmt"]');
  await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
  await emailInput.fill(email);
  await page.locator('input[type="submit"], #idSIButton9').first().click();

  // Champ mot de passe
  const passwordInput = page.locator('input[type="password"], input[name="passwd"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
  await passwordInput.fill(password);
  await page.locator('input[type="submit"], #idSIButton9').first().click();

  // Écran "Rester connecté ?" (KMSI) — pas systématique, ne pas échouer si absent.
  const staySignedIn = page.locator('#idSIButton9');
  try {
    await staySignedIn.waitFor({ state: 'visible', timeout: 8_000 });
    await staySignedIn.click();
  } catch {
    // Écran non affiché pour ce compte/tenant : on continue.
  }
}

export function buildCanvasAppPlayUrl(envId: string, appId: string): string {
  return `https://apps.powerapps.com/play/e/${envId}/a/${appId}`;
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante: ${name}. ` +
        `En CI, vérifie que le job cible le bon GitHub Environment (secrets). ` +
        `En local, copie .env.example vers .env et complète-le.`
    );
  }
  return value;
}
