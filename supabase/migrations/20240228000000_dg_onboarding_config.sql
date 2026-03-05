-- DG Onboarding: company profile, KPI config, dashboard config
-- Adds configuration columns to organizations for auto-generated dashboards

alter table public.organizations
  add column if not exists company_profile text check (company_profile in (
    'groupe_holding',
    'services_b2b',
    'formation_academie',
    'commerce_ecommerce',
    'industrie_production',
    'logistique_livraison',
    'ong_impact',
    'saas_tech'
  )),
  add column if not exists company_sub_profile jsonb default '{}',
  add column if not exists quarterly_objective text check (quarterly_objective in (
    'croissance_ca',
    'rentabilite',
    'satisfaction_client',
    'execution_operationnelle',
    'acquisition_clients',
    'retention',
    'impact_social'
  )),
  add column if not exists selected_kpis jsonb default '[]',
  add column if not exists dashboard_layout jsonb default '{}',
  add column if not exists kpi_thresholds jsonb default '{}',
  add column if not exists dg_onboarding_completed boolean default false;

