// ─── Company Profiles & KPI Packs for DG Onboarding ─────────────────────────

export type CompanyProfile =
  | "groupe_holding"
  | "services_b2b"
  | "formation_academie"
  | "commerce_ecommerce"
  | "industrie_production"
  | "logistique_livraison"
  | "ong_impact"
  | "saas_tech";

export type QuarterlyObjective =
  | "croissance_ca"
  | "rentabilite"
  | "satisfaction_client"
  | "execution_operationnelle"
  | "acquisition_clients"
  | "retention"
  | "impact_social";

export interface KPI {
  id: string;
  label: string;
  unit: string;
  category: string;
}

export interface CompanyProfileConfig {
  id: CompanyProfile;
  label: string;
  icon: string;
  description: string;
  subProfiles: { id: string; label: string }[];
  kpis: KPI[];
}

export interface ObjectiveConfig {
  id: QuarterlyObjective;
  label: string;
  icon: string;
  description: string;
  /** KPI ids to prioritize (put at top) when this objective is selected */
  priorityKpiIds: string[];
}

export const QUARTERLY_OBJECTIVES: ObjectiveConfig[] = [
  { id: "croissance_ca", label: "Croissance du CA", icon: "TrendingUp", description: "Maximiser le chiffre d'affaires et la croissance", priorityKpiIds: ["ca_mensuel", "pipeline_valeur", "cac", "roas", "panier_moyen", "taux_conversion"] },
  { id: "rentabilite", label: "Rentabilité", icon: "PiggyBank", description: "Optimiser les marges et réduire les coûts", priorityKpiIds: ["marge_brute", "ebitda", "cout_unitaire", "marge_projet", "cash_in", "burn_rate"] },
  { id: "satisfaction_client", label: "Satisfaction client", icon: "Heart", description: "Améliorer l'expérience et la fidélisation", priorityKpiIds: ["nps", "satisfaction_client", "taux_renouvellement", "churn", "taux_retours", "sla"] },
  { id: "execution_operationnelle", label: "Exécution opérationnelle", icon: "Target", description: "Accélérer la livraison et l'efficacité", priorityKpiIds: ["execution_okr", "taux_occupation", "delai_livraison", "backlog", "productivite", "disponibilite_equip"] },
  { id: "acquisition_clients", label: "Acquisition clients", icon: "UserPlus", description: "Augmenter le nombre de clients et leads", priorityKpiIds: ["cac", "roas", "taux_conversion", "pipeline_valeur", "inscriptions", "activation"] },
  { id: "retention", label: "Rétention & fidélisation", icon: "Repeat", description: "Retenir les clients existants et augmenter la LTV", priorityKpiIds: ["churn", "taux_renouvellement", "ltv", "retention", "taux_recommandation", "nps"] },
  { id: "impact_social", label: "Impact social", icon: "Globe", description: "Maximiser l'impact sur les bénéficiaires", priorityKpiIds: ["beneficiaires", "projets_livres", "indicateurs_impact", "engagement_benevoles", "partenaires_actifs"] },
];

export const COMPANY_PROFILES: CompanyProfileConfig[] = [
  {
    id: "groupe_holding", label: "Groupe / Holding", icon: "Building2", description: "Multi-filiales, consolidation",
    subProfiles: [{ id: "multi_filiales", label: "Multi-filiales" }, { id: "mono_entite", label: "Mono-entité" }],
    kpis: [
      { id: "ca_consolide", label: "CA consolidé", unit: "€", category: "Finance" },
      { id: "marge_consolidee", label: "Marge consolidée", unit: "%", category: "Finance" },
      { id: "ebitda", label: "EBITDA / Résultat net", unit: "€", category: "Finance" },
      { id: "cash_disponible", label: "Cash disponible", unit: "€", category: "Trésorerie" },
      { id: "burn_rate", label: "Burn rate", unit: "€/mois", category: "Trésorerie" },
      { id: "perf_filiale", label: "Performance par filiale", unit: "index", category: "Opérations" },
      { id: "dette_ebitda", label: "Endettement (Debt/EBITDA)", unit: "ratio", category: "Finance" },
      { id: "execution_okr", label: "Exécution stratégique (OKR %)", unit: "%", category: "Stratégie" },
      { id: "risques_critiques", label: "Risques critiques ouverts", unit: "count", category: "Risques" },
      { id: "dso", label: "DSO (délai paiement clients)", unit: "jours", category: "Trésorerie" },
      { id: "dpo", label: "DPO (délai fournisseurs)", unit: "jours", category: "Trésorerie" },
    ],
  },
  {
    id: "services_b2b", label: "Services B2B", icon: "Briefcase", description: "Cabinet, agence, conseil",
    subProfiles: [
      { id: "b2b_petite", label: "Petite équipe (< 20)" },
      { id: "b2b_moyenne", label: "Moyenne (20-100)" },
      { id: "b2b_grande", label: "Grande (100+)" },
    ],
    kpis: [
      { id: "ca_mensuel", label: "CA mensuel", unit: "€", category: "Finance" },
      { id: "marge_brute", label: "Marge brute", unit: "%", category: "Finance" },
      { id: "marge_projet", label: "Marge par projet", unit: "%", category: "Finance" },
      { id: "pipeline_valeur", label: "Pipeline (valeur + probabilité)", unit: "€", category: "Commercial" },
      { id: "taux_closing", label: "Taux de closing", unit: "%", category: "Commercial" },
      { id: "taux_occupation", label: "Taux d'occupation", unit: "%", category: "Opérations" },
      { id: "sla", label: "Respect SLA / délais", unit: "%", category: "Qualité" },
      { id: "nps", label: "NPS / Satisfaction client", unit: "score", category: "Client" },
      { id: "taux_renouvellement", label: "Taux de renouvellement", unit: "%", category: "Client" },
      { id: "churn", label: "Churn B2B", unit: "%", category: "Client" },
      { id: "cash_in", label: "Cash-in vs prévisions", unit: "€", category: "Trésorerie" },
    ],
  },
  {
    id: "formation_academie", label: "Formation / Académie", icon: "GraduationCap", description: "B2B/B2C, programmes",
    subProfiles: [{ id: "formation_b2b", label: "B2B" }, { id: "formation_b2c", label: "B2C" }, { id: "formation_mixte", label: "Mixte" }],
    kpis: [
      { id: "inscriptions", label: "Inscriptions", unit: "count", category: "Acquisition" },
      { id: "taux_conversion", label: "Taux conversion lead → inscrit", unit: "%", category: "Acquisition" },
      { id: "ca_programme", label: "CA par programme", unit: "€", category: "Finance" },
      { id: "panier_moyen", label: "Panier moyen", unit: "€", category: "Finance" },
      { id: "taux_completion", label: "Taux de complétion", unit: "%", category: "Qualité" },
      { id: "taux_abandon", label: "Taux d'abandon", unit: "%", category: "Qualité" },
      { id: "satisfaction_client", label: "Satisfaction / NPS", unit: "score", category: "Client" },
      { id: "cac", label: "Coût acquisition (CAC)", unit: "€", category: "Marketing" },
      { id: "roi_campagnes", label: "ROI campagnes", unit: "%", category: "Marketing" },
      { id: "taux_recommandation", label: "Taux recommandation / réachat", unit: "%", category: "Client" },
      { id: "impact_certif", label: "Impact (certifications, réussite)", unit: "%", category: "Impact" },
    ],
  },


  {
    id: "commerce_ecommerce", label: "Commerce / E-commerce", icon: "ShoppingCart", description: "Retail, marketplace, e-shop",
    subProfiles: [{ id: "physique", label: "Physique" }, { id: "en_ligne", label: "En ligne" }, { id: "omnicanal", label: "Omnicanal" }],
    kpis: [
      { id: "ca_mensuel", label: "CA", unit: "€", category: "Finance" },
      { id: "commandes", label: "Commandes", unit: "count", category: "Ventes" },
      { id: "panier_moyen", label: "Panier moyen", unit: "€", category: "Ventes" },
      { id: "taux_conversion", label: "Taux de conversion", unit: "%", category: "Ventes" },
      { id: "abandon_panier", label: "Abandon panier", unit: "%", category: "Ventes" },
      { id: "marge_brute", label: "Marge brute", unit: "%", category: "Finance" },
      { id: "cout_logistique", label: "Coût logistique", unit: "€", category: "Opérations" },
      { id: "taux_retours", label: "Taux de retours", unit: "%", category: "Qualité" },
      { id: "produits_top", label: "Produits top / rupture stock", unit: "index", category: "Stock" },
      { id: "cac", label: "CAC", unit: "€", category: "Marketing" },
      { id: "roas", label: "ROAS", unit: "ratio", category: "Marketing" },
      { id: "ltv", label: "LTV", unit: "€", category: "Client" },
      { id: "retention", label: "Rétention", unit: "%", category: "Client" },
    ],
  },
  {
    id: "industrie_production", label: "Industrie / Production", icon: "Factory", description: "Fabrication, personnalisation",
    subProfiles: [{ id: "serie", label: "Série" }, { id: "sur_mesure", label: "Sur mesure" }, { id: "mixte", label: "Mixte" }],
    kpis: [
      { id: "volume_produit", label: "Volume produit", unit: "unités", category: "Production" },
      { id: "productivite", label: "Productivité (unités/jour)", unit: "unités/j", category: "Production" },
      { id: "taux_defauts", label: "Taux de défauts / retours", unit: "%", category: "Qualité" },
      { id: "cout_unitaire", label: "Coût unitaire", unit: "€", category: "Finance" },
      { id: "marge_brute", label: "Marge brute", unit: "%", category: "Finance" },
      { id: "delai_livraison", label: "Respect délais", unit: "%", category: "Opérations" },
      { id: "backlog", label: "Backlog production", unit: "count", category: "Opérations" },
      { id: "rotation_stock", label: "Rotation stock / ruptures", unit: "ratio", category: "Stock" },
      { id: "disponibilite_equip", label: "Disponibilité équipements", unit: "%", category: "Maintenance" },
    ],
  },
  {
    id: "logistique_livraison", label: "Logistique / Livraison", icon: "Truck", description: "Transport, last-mile",
    subProfiles: [{ id: "mono_site", label: "Mono-site" }, { id: "multi_sites", label: "Multi-sites" }],
    kpis: [
      { id: "livraisons_jour", label: "Livraisons/jour", unit: "count", category: "Opérations" },
      { id: "taux_reussites", label: "Taux réussites", unit: "%", category: "Qualité" },
      { id: "temps_moyen", label: "Temps moyen livraison", unit: "min", category: "Opérations" },
      { id: "taux_retard", label: "Taux retard", unit: "%", category: "Qualité" },
      { id: "cout_livraison", label: "Coût par livraison", unit: "€", category: "Finance" },
      { id: "marge_livraison", label: "Marge par livraison", unit: "€", category: "Finance" },
      { id: "annulations", label: "Annulations / litiges", unit: "count", category: "Qualité" },
      { id: "perf_livreur", label: "Performance par livreur", unit: "index", category: "RH" },
      { id: "satisfaction_client", label: "Satisfaction client", unit: "score", category: "Client" },
    ],
  },
  {
    id: "ong_impact", label: "ONG / Programmes d'impact", icon: "Globe", description: "Associations, programmes sociaux",
    subProfiles: [{ id: "local", label: "Local" }, { id: "international", label: "International" }],
    kpis: [
      { id: "beneficiaires", label: "Bénéficiaires", unit: "count", category: "Impact" },
      { id: "projets_livres", label: "Projets livrés", unit: "count", category: "Opérations" },
      { id: "budget_execute", label: "Budget exécuté", unit: "€", category: "Finance" },
      { id: "levees_fonds", label: "Levées de fonds", unit: "€", category: "Finance" },
      { id: "partenaires_actifs", label: "Partenaires actifs", unit: "count", category: "Réseau" },
      { id: "engagement_benevoles", label: "Engagement bénévoles", unit: "count", category: "RH" },
      { id: "indicateurs_impact", label: "Indicateurs d'impact", unit: "index", category: "Impact" },
      { id: "visibilite", label: "Visibilité / engagement communauté", unit: "index", category: "Communication" },
    ],
  },
  {
    id: "saas_tech", label: "SaaS / Tech", icon: "Code", description: "Produit digital, startup",
    subProfiles: [{ id: "early_stage", label: "Early stage" }, { id: "growth", label: "Growth" }, { id: "scale", label: "Scale" }],
    kpis: [
      { id: "dau_mau", label: "Utilisateurs actifs (DAU/MAU)", unit: "count", category: "Produit" },
      { id: "activation", label: "Activation", unit: "%", category: "Produit" },
      { id: "retention", label: "Rétention", unit: "%", category: "Produit" },
      { id: "churn", label: "Churn", unit: "%", category: "Produit" },
      { id: "mrr", label: "MRR", unit: "€", category: "Finance" },
      { id: "arpu", label: "ARPU", unit: "€", category: "Finance" },
      { id: "ltv", label: "LTV", unit: "€", category: "Finance" },
      { id: "cac", label: "CAC", unit: "€", category: "Marketing" },
      { id: "payback_period", label: "Payback period", unit: "mois", category: "Finance" },
      { id: "tickets_support", label: "Tickets support", unit: "count", category: "Support" },
      { id: "temps_resolution", label: "Temps résolution", unit: "h", category: "Support" },
      { id: "uptime", label: "Uptime / incidents", unit: "%", category: "Infra" },
    ],
  },
];

// ─── Dashboard generation helpers ──────────────────────────────────────────

export function getKpisForProfile(profileId: CompanyProfile): KPI[] {
  return COMPANY_PROFILES.find(p => p.id === profileId)?.kpis ?? [];
}

export function sortKpisByObjective(kpis: KPI[], objective: QuarterlyObjective): KPI[] {
  const obj = QUARTERLY_OBJECTIVES.find(o => o.id === objective);
  if (!obj) return kpis;
  const prioritySet = new Set(obj.priorityKpiIds);
  const priority = kpis.filter(k => prioritySet.has(k.id));
  const rest = kpis.filter(k => !prioritySet.has(k.id));
  return [...priority, ...rest];
}

export function generateDefaultThresholds(kpis: KPI[]): Record<string, { warn: number; critical: number }> {
  const thresholds: Record<string, { warn: number; critical: number }> = {};
  for (const kpi of kpis) {
    if (kpi.unit === "%") {
      thresholds[kpi.id] = { warn: 60, critical: 40 };
    } else if (kpi.unit === "score") {
      thresholds[kpi.id] = { warn: 30, critical: 10 };
    } else if (kpi.unit === "ratio") {
      thresholds[kpi.id] = { warn: 2, critical: 3 };
    }
  }
  return thresholds;
}

export function generateDashboardLayout(
  selectedKpis: KPI[],
  objective: QuarterlyObjective
): { widgets: string[]; topRow: string[]; sections: { title: string; kpiIds: string[] }[] } {
  const obj = QUARTERLY_OBJECTIVES.find(o => o.id === objective);
  const prioritySet = new Set(obj?.priorityKpiIds ?? []);

  const topRow = selectedKpis.filter(k => prioritySet.has(k.id)).slice(0, 4).map(k => k.id);

  const categoryMap = new Map<string, string[]>();
  for (const kpi of selectedKpis) {
    if (!categoryMap.has(kpi.category)) categoryMap.set(kpi.category, []);
    categoryMap.get(kpi.category)!.push(kpi.id);
  }

  const sections = Array.from(categoryMap.entries()).map(([title, kpiIds]) => ({ title, kpiIds }));

  return {
    widgets: selectedKpis.map(k => k.id),
    topRow,
    sections,
  };
}