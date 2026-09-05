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
    // Fluent UI (TabList2) rend le libellé deux fois (span visible + span technique
    // "reserved-space" pour le dimensionnement) : getByText est ambigu, getByRole('tab') ne l'est pas.
    await this.frame.getByRole('tab', { name: label, exact: true }).click();
  }

  async openNewRequestForm(): Promise<void> {
    await this.clickControl(Controls.btnAjouter);
  }

  /**
   * Sélectionne le demandeur dans le combo de recherche (cmbDemandeur).
   *
   * Diagnostic confirmé (voir historique du run CI) : le connecteur Office365Users
   * répond bien HTTP 200, mais chercher sur l'EMAIL COMPLET renvoie une liste vide
   * (`role=listbox` ouvert, 0 `option`) — la recherche matche le nom d'affichage
   * ("Sharepoint1 TEST"), pas l'adresse email. `searchTerm` doit donc être un
   * fragment du nom d'affichage, pas l'email — passer explicitement le bon terme
   * (dérivable depuis l'email n'est pas fiable : "admin.spo1@..." -> "Admin1
   * Sharepoint" n'a aucune relation directe avec le nom d'affichage).
   */
  async selectDemandeur(searchTerm: string): Promise<void> {
    const wrapper = this.byControl(Controls.champDemandeur);
    const input = wrapper.locator('input');
    const option = this.frame.getByRole('option').first();
    for (let attempt = 1; attempt <= 3; attempt++) {
      await wrapper.click();
      await input.fill('').catch(() => {});
      await input.pressSequentially(searchTerm, { delay: 80 });
      try {
        await option.waitFor({ state: 'visible', timeout: 5_000 });
        await option.click();
        return;
      } catch {
        // Rien trouvé pour ce terme sur cette tentative — on réessaie.
      }
    }
    throw new Error(
      `Aucune suggestion trouvée pour le demandeur avec le terme de recherche "${searchTerm}" après 3 tentatives.`
    );
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

  /**
   * `[data-control-name]` résout vers le `<div>` wrapper du contrôle, pas vers le vrai
   * `<input>`/`<textarea>` interne (contrairement à un HTML natif) — d'où ce helper au
   * lieu d'un simple `.fill()` sur `byControl(name)`.
   */
  async fillControl(name: string, value: string): Promise<void> {
    const wrapper = this.byControl(name);
    await wrapper.waitFor({ state: 'visible', timeout: 15_000 });
    // `:visible` exclut un éventuel <textarea> caché de mesure/binding qui coexisterait
    // avec un div contenteditable visible (control "rich text") — sans ça, `.first()`
    // peut retenir l'élément invisible selon l'ordre du DOM, jamais remplissable.
    const editable = wrapper.locator('input:visible, textarea:visible, [contenteditable="true"]:visible').first();

    const isReady = () => editable.isVisible().catch(() => false);

    if (!(await isReady())) {
      // Le formulaire est une modale scrollable, mais son scroll n'est pas un vrai scroll
      // DOM natif (confirmé : `scrollIntoViewIfNeeded` time out sans jamais rendre le
      // champ visible) — probablement un rendu virtualisé/transform Power Apps. On
      // scrolle donc à la molette, par petits pas pour ne pas sauter par-dessus un champ
      // bas, jusqu'à ce que le champ visé devienne visible.
      for (let i = 0; i < 25 && !(await isReady()); i++) {
        await this.page.mouse.move(640, 400);
        await this.page.mouse.wheel(0, 80);
        await this.page.waitForTimeout(150);
      }
    }

    await editable.fill(value);
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
