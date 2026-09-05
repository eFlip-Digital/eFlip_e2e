import { Page, FrameLocator, expect } from '@playwright/test';
import { Controls } from '../support/selectors';

const APP_HOST_IFRAME = 'iframe[name="fullscreen-app-host"]';

export class SdcCanvasAppPage {
  readonly page: Page;
  readonly frame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.frame = page.frameLocator(APP_HOST_IFRAME);
  }

  byControl(name: string) {
    return this.frame.locator(`[data-control-name="${name}"]`);
  }

  /** Attend que la galerie principale soit chargée (données SharePoint arrivées). */
  async waitForLoad(): Promise<void> {
    await this.byControl(Controls.galerieDemandes)
      .locator('[data-control-part="gallery-item"]')
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 });
  }

  /** Ferme les bannières "ancienne version" / "environnement développeur" si présentes. */
  async dismissBanners(): Promise<void> {
    const closeButtons = this.page.locator('button[aria-label="Close"], button:has-text("Refresh")');
    const count = await closeButtons.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click({ timeout: 2_000 }).catch(() => {});
    }
  }

  async goToOnglet(label: 'Mes demandes' | 'Mes validations'): Promise<void> {
    await this.frame.getByText(label, { exact: true }).click();
  }

  async openNewRequestForm(): Promise<void> {
    await this.clickControl(Controls.btnAjouter);
  }

  /** Sélectionne le demandeur dans le combo de recherche (cmbDemandeur) par email. */
  async selectDemandeur(email: string): Promise<void> {
    const combo = this.byControl(Controls.champDemandeur);
    await combo.click();
    await combo.locator('input').fill(email);
    await this.frame.getByText(email, { exact: false }).first().click();
  }

  /** Ouvre la fiche détail d'une demande depuis la galerie, par son titre. */
  async openCardByTitle(title: string): Promise<void> {
    const card = this.frame
      .locator('[data-control-part="gallery-item"]')
      .filter({ hasText: title });
    await card.first().waitFor({ state: 'visible', timeout: 30_000 });
    await card.first().click();
  }

  /** Lit le statut (texte du pill) affiché sur la carte d'une demande dans la galerie. */
  async getStatutOnCard(title: string): Promise<string> {
    const card = this.frame
      .locator('[data-control-part="gallery-item"]')
      .filter({ hasText: title })
      .first();
    await card.waitFor({ state: 'visible', timeout: 30_000 });
    // Le pill Statut est le seul texte en gras coloré de la carte ; à ajuster une fois
    // le vrai data-control-name du pill confirmé (voir selectors.ts).
    const statutText = await card.locator('text=/En attente|Soumis|Approuvée|Remboursée|Rejet/').first().textContent();
    return (statutText ?? '').trim();
  }

  async clickControl(name: string): Promise<void> {
    const el = this.byControl(name);
    await el.waitFor({ state: 'visible', timeout: 15_000 });
    await el.click();
  }

  async clickByVisibleText(text: string): Promise<void> {
    await this.frame.getByText(text, { exact: true }).first().click();
  }

  async expectNoErrorNotification(): Promise<void> {
    await expect(
      this.frame.getByText(/erreur est survenue|champs obligatoires/i)
    ).toHaveCount(0);
  }
}
