/**
 * Noms de contrôles (`data-control-name`) de l'app Canvas "Sortie et Retour de caisse".
 *
 * Toutes les valeurs ci-dessous sont [CONFIRMÉ] : extraites directement du fichier
 * source HomeScreen.pa.yaml via une session Canvas Authoring (pas besoin d'inspection
 * DOM live — plus fiable, puisque c'est la source de vérité de l'app elle-même).
 * `tests/00-discover-selectors.spec.ts` reste utile pour re-valider après une
 * modification de l'app, mais n'est plus bloquant pour démarrer.
 */
export const Controls = {
  // Accueil / galerie
  galerieDemandes: 'GalSDC_Items',
  btnRefreshAllItems: 'btnRefreshAllItems',
  btnAjouter: 'btnAddNewSDC', // Icon: "Add", visible seulement sur l'onglet "Mes demandes" (varSelectedTab = 1)

  // Filtres de la galerie
  filtreDescription: 'txtFilDesc',
  filtreStatut: 'drpFilStatus',
  filtreNiveauApprobation: 'drpFilNiveauAppr',
  filtreDateDebut: 'dpFilStartDate',
  filtreDateFin: 'dpFilEndDate',

  // Formulaire de création / édition de la demande (modale "Nouvelle demande de sortie de caisse")
  formSaveOrEdit: 'btnSDCForm_SaveOrEdit', // Texte : "Enregistrer" (création) / "Modifier" (édition)
  champDemandeur: 'cmbDemandeur', // combo de recherche, placeholder "Rechercher un demandeur..."
  champTitre: 'txtDemandeTitre',
  champMontant: 'nbMontantDemande',
  champMontantEnLettre: 'txtSDCMontantEnLettre',
  champMotif: 'rtxtMotifDemande',
  champCentreDeCout: 'drpCentreDeCoutDemande', // optionnel
  champDepartement: 'drpDepartements', // optionnel

  // Actions sur une demande sélectionnée (modales par étape)
  btnSoumettreDemande: 'btnMdConfirmSubmit_4', // round "Demande"
  btnAccuserReception: 'btnAccuseReceptionSDC',
  btnAccuserReceptionEnvoyer: 'btnSendRetour_1', // bouton "Envoyer" de la modale Accusé
  btnConfirmerPaiement: 'btnConfirmPaiement',
  btnSoumettreRetour: 'btnSubmitRetourSDC', // visibilité conditionnée par Statut="Approuvée"
  btnEnvoyerRetour: 'btnSDCForm_RetourDeCaisse_SendRetour', // bouton "Envoyer" de la modale Retour
  btnConfirmDeleteItem: 'btnConfirmDeleteItem',

  // Champs de la modale Retour de caisse
  champMontantRetour: 'nbMontantRetour',
  champMontantRetourEnLettres: 'txtSDC_RetourDeCaisse_MontantEnLettres',
  piecesJointesRetour: 'attachPieceJointesRetour',

  // Timeline de validation (sur la fiche détail)
  galerieTimeline: 'GalSDCValidationTimeline',
} as const;

/**
 * Sélecteurs par LIBELLÉ VISIBLE. Utilisés pour le TabList2 (contrôle "TabList", pas
 * de data-control-name par item individuel — Items: ["Mes demandes", "Mes validations"])
 * où cibler par texte est plus simple et tout aussi fiable qu'un nom de contrôle.
 */
export const TextLabels = {
  ongletMesDemandes: 'Mes demandes',
  ongletMesValidations: 'Mes validations',
  boutonEnregistrer: 'Enregistrer',
  boutonAnnuler: 'Annuler',
  boutonSoumettre: 'Soumettre',
  boutonEnvoyer: 'Envoyer',
} as const;
