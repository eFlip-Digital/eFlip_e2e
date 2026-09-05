# Tests E2E — Sortie et Retour de caisse (GOC_DEV)

Scaffold Playwright pour tester l'app Canvas "Sortie et Retour de caisse" en jouant
plusieurs rôles du workflow (Demandeur, Gestionnaire Caisse, Directeur Financier).

## État actuel

**Sélecteurs confirmés.** `support/selectors.ts` a été rempli directement depuis le
vrai `HomeScreen.pa.yaml` (relu via la session Canvas Authoring), pas par inspection
DOM live — plus fiable. `tests/00-discover-selectors.spec.ts` reste dans le dépôt
comme test utilitaire pour re-valider après une future modification de l'app, mais
n'est plus une étape obligatoire avant de lancer les scénarios 01-05.

Reste à faire avant le premier run réel :

**Comptes de test.** Déjà provisionnés comme Organization Variables/Secrets eFlip.
   Mapping rôle -> compte utilisé par `.github/workflows/sdc-e2e.yml` :

   | Rôle | Login (`vars.*`) | Mot de passe (`secrets.*`) |
   |---|---|---|
   | Demandeur | `ADMIN2LOGINNAME` | `ADMIN2PASSWORD` |
   | Gestionnaire Caisse | `ADMIN2LOGINNAME` | `ADMIN2PASSWORD` |
   | Directeur Financier | `SHAREPOINTTEST2LOGINNAME` | `SHAREPOINTTEST2PASSWORD` |
   | ADG | `ADMIN1LOGINNAME` | `ADMIN1PASSWORD` (pas encore câblé dans un job — à ajouter si un scénario couvre l'approbation ADG) |

   ⚠️ **Demandeur = ADMIN2, pas un compte SHAREPOINTTEST dédié.** Découvert en testant :
   la connexion SharePoint de l'app est partagée/intégrée sous l'identité admin.spo2 —
   toutes les lectures/écritures de l'app passent par ce compte quel que soit
   l'utilisateur réellement connecté dans l'UI. Le flux `SDC_AppliquerPermissions`
   restreint ensuite la lecture de chaque demande au demandeur+créateur ; si les deux
   sont un compte autre qu'admin2, admin2 (l'identité réelle de la connexion) n'a plus
   accès à l'item, qui devient invisible pour l'app — y compris pour son propre
   créateur. Bug applicatif réel, pas un problème de script (tâche de suivi créée,
   voir Shared_SortieCaisse.md). En attendant un correctif, le Demandeur des tests doit
   rester ADMIN2.

   ⚠️ **Ces 4 mots de passe sont actuellement stockés comme Organization *Variables*
   (visibles en clair, visibilité "Public repositories"), pas comme *Secrets*.**
   Le workflow ci-dessus référence `secrets.*PASSWORD` — tant que les mots de passe
   ne sont pas déplacés vers Organization → Secrets (mêmes noms), ces valeurs seront
   vides en CI. Déplace-les avant le premier run, et restreins la visibilité.

   Les comptes doivent aussi être **sans MFA** (sinon le login headless bloque, faute
   d'humain pour valider).

## Lancer en local

```bash
cd sdc-e2e-tests
npm install
npx playwright install --with-deps chromium
cp .env.example .env   # puis compléter SDC_TEST_EMAIL / SDC_TEST_PASSWORD (compte ADMIN2 pour ce test)
npx playwright test 01-demandeur-creer-et-soumettre.spec.ts
SDC_ITEM_TITLE=<titre affiché par le test précédent> npx playwright test 02-gestionnaire-accuser-reception.spec.ts
# etc.
```

## Organisation des tests

| Fichier | Rôle joué | Couvre |
|---|---|---|
| `01-demandeur-creer-et-soumettre` | Demandeur | Création + soumission (régression A.3/A.4) |
| `02-gestionnaire-accuser-reception` | Gestionnaire Caisse | Accusé de réception |
| `03-directeur-financier-confirmer-paiement` | Directeur Financier | Confirmation paiement |
| `04-demandeur-soumettre-retour` | Demandeur | Soumission du retour (régression A.3, pièce jointe) |
| `05-galeries-et-timeline` | Demandeur | Régressions A.2/C.6/C.7 : icônes timeline, visibilité galerie après clôture |

`playwright.config.ts` force `workers: 1` et pas de parallélisation : les tests
partagent la même demande créée par le test 01, donc l'ordre compte.

## CI — `.github/workflows/sdc-e2e.yml`

Un job par rôle, chaîné via `needs:` ; chaque job ne référence que les
`vars.*LOGINNAME` / `secrets.*PASSWORD` du compte de son rôle (voir tableau
ci-dessus). Le titre de la demande créée passe d'un job à l'autre via `outputs`.

Déclenché uniquement en manuel (`workflow_dispatch`) pour l'instant — décommenter le
`schedule:` une fois le scénario validé manuellement au moins une fois de bout en
bout.

## Point de vigilance : Conditional Access

Un blocage Conditional Access a déjà été rencontré sur ce tenant pour l'app native
"Microsoft Azure CLI" avec un compte de test (`admin.spo1`). Le login utilisé ici
(`support/auth.ts`) passe par le formulaire web Microsoft standard, un flux différent
qui devrait ne pas être concerné — mais si le login headless échoue en CI avec un
compte donné, vérifier d'abord les policies CA avant de suspecter le script.
