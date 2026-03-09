# 📊 ANALYSE COMPLÈTE - ZORO PILOT

**Date d'analyse** : 26 février 2026  
**Version** : v0.1.0  
**Status** : MVP avancé pré-production

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture & Stack](#architecture--stack)
3. [Structure du projet](#structure-du-projet)
4. [Analyse métier](#analyse-métier)
5. [Points forts](#points-forts)
6. [Problèmes identifiés](#problèmes-identifiés)
7. [Dettes techniques](#dettes-techniques)
8. [Recommandations](#recommandations)
9. [Roadmap proposée](#roadmap-proposée)

---

## Vue d'ensemble

**ZORO PILOT** est une plateforme de **pilotage stratégique et exécution opérationnelle** combinant :

- 🎯 **Gestion OKR/Stratégie** : définition d'objectifs, key results, check-ins, suivi de confiance
- 📋 **Gestion Projets/Tâches** : portfolio de projets, tâches assignées, roadmap
- 📊 **Tableaux de bord** : dashboards KPI, graphiques de performance, RAG status
- 💬 **Collaboration** : channels contextuels (OKR, projets), threading, mentions
- 🔐 **Authentification & RBAC** : intégration Supabase, rôles multi-scope

**Vision produit** : *"La stratégie rencontre l'exécution"* → Connecter la vision directrice au travail quotidien des équipes.

---

## Architecture & Stack

### Stack technique

| Couche | Technologie | Version | Rôle |
|--------|------------|---------|------|
| **Metaframework** | Next.js | 16.1.6 | App Router, SSR/SSG, API routes |
| **Runtime** | Node.js | 19+ (inféré) | Serveur Next |
| **Frontend** | React | 19.2.4 | Composants UI, interactivité client |
| **Styling** | Tailwind CSS | 4 | Utilitaires CSS, thème personnalisé |
| **UI Kit** | Radix UI + shadcn | Latest | Composants accessibles standardisés |
| **Formulaires** | React Hook Form | 7.54.1 | Validation réactive, gestion d'état |
| **Charts** | Recharts | Latest | Graphiques réactifs (bar, pie, radar) |
| **BDD/Auth** | Supabase | 2.97.0 | PostgreSQL, auth SSR, realtime |
| **Drag & Drop** | dnd-kit | 6.3.1 | Tri, kanban, réordonnancement |
| **Typage** | TypeScript | Latest | Sécurité de type complète |
| **Analytics** | Vercel Analytics | 1.6.1 | Monitoring usage |
| **Icônes** | Lucide React | 0.564.0 | 500+ icônes vectorielles |

### Architecture applicative

```
┌─────────────────────────────────────────────────────┐
│                  User Browser                        │
│         (React 19 Client Components)                 │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │ App Router          │
        │ (Next.js 16)        │
        │ - layouts           │
        │ - pages (12 routes) │
        │ - server actions    │
        └──────┬──────────────┘
               │
    ┌──────────┼──────────────┐
    │          │              │
    ▼          ▼              ▼
┌─────┐  ┌──────────┐  ┌───────────┐
│ API │  │Middleware│  │Components │
│     │  │& Auth    │  │& Hooks    │
│ RSC │  │(Supabase)│  │(React UI) │
└─────┘  └──────────┘  └───────────┘
    │          │              │
    └──────────┼──────────────┘
               │
        ┌──────▼─────────┐
        │ Supabase       │
        │ PostgreSQL DB  │
        │ Auth (JWT)     │
        │ Realtime       │
        └────────────────┘
```

---

## Structure du projet

### Hiérarchie de répertoires

```
zoro-pilot/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Route: / (Dashboard)
│   ├── layout.tsx               # Root layout (Theme, Auth)
│   ├── actions.ts               # Server Actions globales
│   ├── globals.css              # Styles globaux
│   │
│   ├── strategy/                # Route: /strategy
│   │   └── page.tsx             # Gestion OKR/Stratégie
│   │
│   ├── work/                    # Route: /work
│   │   └── page.tsx             # Portfolio projets
│   │
│   ├── create/                  # Route: /create (Multi-purpose)
│   │   ├── page.tsx             # Hub de création
│   │   ├── calendar/            # Créer événement calendrier
│   │   ├── chat/                # Créer channel
│   │   ├── dashboard/           # Créer dashboard
│   │   ├── database/            # Créer base de données
│   │   ├── doc/                 # Créer document
│   │   ├── folder/              # Créer dossier
│   │   ├── list/                # Créer liste
│   │   ├── my-day/              # Créer objectif journalier
│   │   ├── portfolio/           # Créer portfolio
│   │   ├── project/             # Créer projet
│   │   └── task/                # Créer tâche
│   │
│   ├── calendar/                # Route: /calendar
│   ├── my-day/                  # Route: /my-day
│   ├── all-tasks/               # Route: /all-tasks
│   ├── performance/             # Route: /performance (KPI)
│   ├── inbox/                   # Route: /inbox
│   ├── login/                   # Route: /login (Auth)
│   ├── reviews/                 # Route: /reviews
│   ├── reports/                 # Route: /reports
│   ├── settings/                # Route: /settings
│   └── strategy/                # Route: /strategy
│
├── components/                   # Composants React réutilisables
│   ├── app-shell.tsx            # Layout maître (détecte homepage vs pages)
│   ├── app-sidebar.tsx          # Navigation principale (12 items)
│   ├── strategic-dashboard.tsx  # Dashboard principal (599 lignes) ⚠️
│   ├── chat-panel.tsx           # Panneau chat intégré
│   ├── rag-badge.tsx            # Indicateur statut RAG
│   ├── widget-hub.tsx           # Hub de widgets
│   ├── theme-provider.tsx       # Context thème (next-themes)
│   ├── theme-toggle.tsx         # Switch light/dark
│   ├── user-avatar.tsx          # Avatar utilisateur
│   │
│   ├── ui/                      # Design system (40+ composants)
│   │   ├── button.tsx           # Bouton de base
│   │   ├── card.tsx             # Conteneur universel
│   │   ├── form.tsx             # Wrapper React Hook Form
│   │   ├── sidebar.tsx          # Sidebar Radix
│   │   ├── table.tsx            # Table données
│   │   ├── calendar.tsx         # Calendrier React Day Picker
│   │   ├── chart.tsx            # Wrapper Recharts
│   │   └── ... (30+ autres)
│   │
│   └── theme/
│       └── theme-variant-switch.tsx  # Sélecteur variantes thème
│
├── hooks/                        # Custom React Hooks
│   ├── use-mobile.ts            # Détection écran mobile
│   ├── use-permissions.ts       # Vérification permissions RBAC
│   ├── use-supabase.ts          # Client Supabase
│   └── use-toast.ts             # Notifications toast
│
├── lib/                          # Utilitaires & services
│   ├── store.ts                 # Types métier + données mock (636 lignes)
│   ├── rbac.ts                  # Permissions & rôles (148 lignes)
│   ├── utils.ts                 # Fonctions utilitaires
│   │
│   └── supabase/                # Intégration Supabase
│       ├── server.ts            # Client Supabase serveur (SSR)
│       ├── middleware.ts        # Middleware authentification
│       └── client.ts            # Client Supabase navigateur
│
├── public/                       # Ressources statiques
│   ├── placeholder-*.png/svg    # Images de placeholder
│   └── icon-*.png               # Icônes favicons
│
├── scripts/                      # Scripts utilitaires
│   └── seed-supabase.ts         # Peuplement BDD initiale
│
├── supabase/                    # Configuration Supabase
│   └── migrations/              # Migrations SQL (schéma BDD)
│
├── Configuration Files
│   ├── package.json             # Dépendances (79 packages)
│   ├── tsconfig.json            # Config TypeScript (strict mode)
│   ├── next.config.mjs          # Config Next.js
│   ├── tailwind.config.mjs      # Config Tailwind (thème custom)
│   ├── postcss.config.mjs       # Transformations CSS
│   ├── components.json          # Config shadcn
│   ├── middleware.ts            # Middleware Next (déprécié)
│   ├── pnpm-lock.yaml           # Lock npm (pnpm)
│   │
│   └── Données seed
│       ├── seed-data.sql        # Données SQL statiques
│       └── supabase-schema.sql  # Schéma BDD complet
```

### Nombre de fichiers par domaine

| Domaine | Fichiers | LOC estimé | Complexité |
|---------|----------|-----------|-----------|
| Pages (routes) | 12 | 300-500 | Basse (wrapper) |
| Composants métier | 4 | 800 | Haute (StrategicDashboard) |
| Design System (ui) | 40+ | 2000-3000 | Moyenne |
| Hooks | 4 | 200 | Basse |
| Services (lib) | 5 | 1000 | Moyenne-haute |
| Configuration | 6 | 300 | Basse |
| **TOTAL** | **~70** | **~5000-6000** | **Moyenne** |

---

## Analyse métier

### 1. Entités métier principales

#### A. Stratégie (OKR Framework)
- **Pilier** : axe stratégique (Croissance, Excellence Produit, Equipe & Culture)
- **Objectif** : but annuel/trimestriel (ex: "Étendre présence 3 régions")
- **Key Result** : résultat mesurable (ex: "500 nouvelles inscriptions")
- **Check-in** : point d'étape périodique (confidence, blocker, note)

**Types de KR** : metric, initiative, manual  
**Confiance** : on-track, at-risk, off-track

#### B. Exécution (Projets & Tâches)
- **Projet** : regroupement work, peut être lié à 1+ OKR
- **Tâche** : work unit, assignée à 1 personne, statut (todo/in-progress/blocked/done)
- **Lien OKR↔Projet** : traçabilité stratégie → execution

#### C. Collaboration
- **Channel** : espace de discussion (public, private, dm, contextualisé)
- **Message** : texte, fichier, system event, avec threading + reactions
- **Contexte** : channel lié à objectif/projet/tâche

#### D. Organisation
- **User** : personne (nom, rôle, avatar, équipe, manager)
- **Team** : regroupement (peut avoir parent team, manager)
- **RBAC Role** : admin, executive, manager, member, viewer
- **Permission** : action au scope organization ou project

### 2. Flux utilisateur principal

```
┌─────────────────────────────────────────────────────────┐
│ 1. Authentification (Supabase)                           │
│    - Login avec email/password                          │
│    - JWT token en session                               │
│    - RBAC lookup user_roles + permissions               │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 2. Homepage (StrategicDashboard)                         │
│    - Affichage OKR du trimestre                          │
│    - KPI globaux (charts Recharts)                       │
│    - Projets "on-track/at-risk/off-track"               │
│    - Liens rapides vers créations                       │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬───────────────┐
    │            │            │               │
┌───▼──┐  ┌─────▼────┐  ┌──────▼────┐  ┌────▼─────┐
│Strat.│  │Projets & │  │Calendrier │  │Détails   │
│ OKR  │  │ Tâches   │  │globale    │  │KPI       │
└──────┘  └──────────┘  └───────────┘  └──────────┘
    │            │            │               │
    │            │            │               │
└────────────────┼────────────┴───────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ 3. Contexte (Détails) → Chat contextuel                 │
│    - Discussions liées à OKR / Projet / Tâche            │
│    - Mise à jour check-in avec evidence                 │
│    - Collaborateurs intégrés                            │
└──────────────────────────────────────────────────────────┘
```

### 3. Données de démo intégrées

**6 utilisateurs** (écosystème complet) :
- Sarah Chen (PDG, admin)
- Marc Dubois (VP Produit, manager)
- Amina Youssef (Engineering, manager)
- Lucas Martin (Designer, member)
- Fatima Benali (Marketing, manager)
- Omar Kassim (Dev, member)

**Hiérarchie équipes** :
```
Direction (Sarah)
├─ Produit (Marc) → Lucas
├─ Engineering (Amina) → Omar
└─ Marketing (Fatima)
```

**3 Objectifs T1 2026** :
1. "Étendre présence 3 régions" (Croissance, 65% progress, on-track)
2. "Plateforme v2.0" (Excellence Produit, 45% progress, at-risk) ⚠️
3. "Culture équipe performante" (Equipe, 78% progress, on-track)

**Chaque objectif** → 3 Key Results (mix métrique/initiative)  
**Channels de démo** → 4 channels (General, Leadership, 2 contextuels Project + Objectif)

---

## Points forts

### ✅ 1. Vision produit clairement articulée

- **Promesse** : lier stratégie (OKR) ↔ exécution (projets/tâches)
- **Validation** : types métier cohérents, données de démo complètes
- **Flexibilité** : RBAC pensé pour multi-org, multi-project scopes

### ✅ 2. Stack moderne et bien-fondée

- **Next.js 16** App Router : performance, SSR, middleware, server components
- **React 19** : hooks, concurrency, suspense prêt
- **Radix UI + shadcn** : composants accessibles, consistants, maintenant une large communauté
- **Tailwind 4** : utilitaires poussés, thème sombre natif

### ✅ 3. UI/UX Premium

- **Néons + glassmorphism** : design moderne, immersive
- **Chartes visuelles** : KPI badging (good/warn/bad), progression neon, donut charts
- **Accessibility** : Radix → ARIA compliant
- **Responsive** : breakpoints Tailwind intégrés

### ✅ 4. Données riches et réalistes

- 6 utilisateurs, 4 équipes, hiérarchie managériale
- 3 objectifs + 9 key results avec progression réelle
- 4 channels avec 5 messages simulant vrais échanges stratégiques
- Démo reproductible sans BDD externe

### ✅ 5. Authentification en place

- Supabase SSR middleware configuré
- Session JWT maintenue
- RBAC couche de contrôle (même si simplifiée actuellement)

### ✅ 6. Configuration initiale poussée

- `tsconfig.json` strict mode on
- Tailwind + PostCSS setup
- shadcn configured (`components.json`)
- Next.js 16 optimizations

---

## Problèmes identifiés

### 🔴 CRITIQUE

#### 1. **Build échoue : Google Fonts indisponible**

**Location** : `app/layout.tsx:6-7`
```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })
```

**Symptôme** : `pnpm build` échoue si `fonts.googleapis.com` inaccessible (CI/CD sécurisé, proxy bloquant, offline)

**Impact** : Builds fragiles, impossible hors-ligne

---

#### 2. **Lint cassé : Configuration ESLint manquante**

**Symptôme** : `pnpm lint` échoue avec erreur ESLint 9
```
Error: Config must be an object or an array of config objects
```

**Raison** : ESLint 9 requiert `eslint.config.*` (mjs/cjs), pas `.eslintrc.*`

**Impact** : Pas de contrôle qualité (style, imports, types), baisse de garde-fou

---

### 1. Routage et Sécurité (`proxy.ts`)

- **Routage multi-domaine** : Le fichier `proxy.ts` est configuré pour détecter le nom d'hôte (`hostname`).
- **Isolation du Back Office** : Toute requête sur le domaine `ADMIN_DOMAIN` est réécrite vers le dossier secret `/bo-zoro-control-2026-secure`.
- **Blocage de sécurité** : Toute tentative d'accès au dossier secret depuis `APP_DOMAIN` renvoie une erreur 403 (Accès refusé).
- **Persistence des sessions** : Le proxy utilise Supabase pour rafraîchir les sessions utilisateur à chaque requête.

---

### 🟡 MAJEUR

#### 4. **StrategicDashboard surdimensionné**

**Location** : `components/strategic-dashboard.tsx` (599 lignes)

**Contient** :
- UI layout (grid, cards)
- Logique d'interactivité (useState pour expandable items)
- Composants chartes (Recharts inline)
- Données mock transformées
- Navigation items

**Impact** : Difficult à tester, maintenir, réutiliser. Refactor nécessaire.

**Découpage proposé** :
```
StrategicDashboard (orchestration)
├── OKRSectionWidget (OKR grid)
├── ProjectsRiskWidget (project badges + RAG)
├── KPIDashboard (charts recap)
├── ActionBar (boutons rapides)
└── NavigationHub (12 nav items)
```

---

#### 5. **Imports inutilisés / Logique morte**

**Symptômes** :
- `ChatPanel`, `ThemeToggle` importés dans sidebar mais non utilisés
- `MoreHorizontal` icon importée dans sidebar but no dropdown menus
- Plusieurs fichiers `page.tsx` dans `/create/*` sont stubs vides

**Impact** : Bruit code, confusion mainteneur, accumulation dette

---

#### 6. **Routes `/create/*` non implémentées**

**Location** : `app/create/calendar/`, `app/create/chat/`, etc.

**Status** : Répertoires créés, `page.tsx` absent ou stub

**Impact** : Liens sidebar → 404 silencieux

---

#### 7. **Typage partiel sur données Supabase**

**Location** : `lib/rbac.ts` lignes 54-56
```typescript
// @ts-ignore - Supabase types might be deep
const role = ur.role
```

**Impact** : Bypass du système de types, erreurs runtime possibles

---

### 🟠 MOYEN

#### 8. **Type Confidence vs RAGStatus redondant**

**Location** : `lib/store.ts`
```typescript
export type RAGStatus = "on-track" | "at-risk" | "off-track"
export type Confidence = "on-track" | "at-risk" | "off-track"  // Identique !
```

**Impact** : Ambiguïté sémantique, deux noms pour même concept

---

#### 9. **Données mock VS types non séparées**

**Location** : `lib/store.ts` (636 lignes = types + 500+ lignes data mock)

**Problème** : Si on veut swapper données→Supabase, faut tout refactorer

**Solution** : Créer `lib/mocks/` séparé, `lib/store.ts` = types seulement

---

#### 10. **RBAC incomplet en frontend**

**Location** : `hooks/use-permissions.ts` (non examiné mais probable)

**Problème** : Contrôles permission surtout server-side, frontend affiche tout

**Impact** : Pas de véritable "role masking" UI (affiche boutons admin à viewer)

---

#### 11. **Theme hardcoded en layout**

**Location** : `app/layout.tsx:22`
```tsx
<html lang="fr" suppressHydrationWarning data-dashboard-theme="command-center">
```

**Impact** : Pas de switch de variante thème pour utilisateur

---

## Dettes techniques

### Catégories de dette

| Dette | Sévérité | Effort | Priorité |
|-------|----------|--------|----------|
| ESLint config | 🔴 | 1h | **HAUTE** |
| Google Fonts fallback | 🔴 | 2h | **HAUTE** |
| Middleware → Proxy | 🟡 | 3h | MOYENNE |
| Split StrategicDashboard | 🟡 | 4-6h | MOYENNE |
| Implémenter `/create/*` | 🟡 | 3-4h | MOYENNE |
| Cleanup imports | 🟠 | 1h | BASSE |
| Typage Supabase | 🟠 | 2h | MOYENNE |
| RBAC frontend | 🟡 | 3-4h | MOYENNE |

**Total** : ~19-25 heures de travail

---

## Recommandations

### 🎯 Phase 1 : Stabilité immédiate (1-2 jours)

#### 1.1 Créer `eslint.config.mjs`
```javascript
// eslint.config.mjs
import js from '@eslint/js'
import tsPlugin from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
      // ... rules
    }
  }
]
```

**Impact** : `pnpm lint` fonctionne → CI/CD de qualité

---

#### 1.2 Remplacer Google Fonts par fallback
```tsx
// app/layout.tsx
// Option A: Local fonts
import localFont from 'next/font/local'

const inter = localFont({
  src: [
    { path: './fonts/inter.woff2', weight: '400' },
    { path: './fonts/inter-bold.woff2', weight: '700' }
  ]
})

// Option B: Fallback à système fonts
// Tailwind config: fontFamily: { sans: ['system-ui', 'sans-serif'] }
```

**Impact** : Build 100% offline-capable

---

#### 1.3 Mettre à jour `package.json` scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "clean": "rm -rf .next"
  }
}
```

---

### 🎯 Phase 2 : Architecture & Maintenabilité (3-5 jours)

#### 2.1 Restructurer `lib/` pour séparer données/types

```
lib/
├── store.ts              # Types UNIQUEMENT
├── mocks/
│   ├── users.ts          # export const users: User[]
│   ├── objectives.ts     # export const objectives: Objective[]
│   ├── projects.ts
│   ├── channels.ts
│   └── messages.ts
├── rbac.ts               # RBAC logic
└── supabase/
    ├── server.ts
    ├── client.ts
    └── middleware.ts
```

**Impact** : Code modulaire, swap donnees réel→mock facile

---

#### 2.2 Découper StrategicDashboard

Créer sous-composants :
- `widgets/OKRGrid.tsx`
- `widgets/ProjectsRiskPanel.tsx`
- `widgets/KPICharts.tsx`
- `widgets/QuickActions.tsx`
- `StrategicDashboard.tsx` → orchestration uniquement

**Impact** : Composants testables, réutilisables

---

#### 2.3 Implémenter pages `/create/*`

Créer pages génériques ou stubs :
```tsx
// app/create/calendar/page.tsx
'use client'
import { CalendarForm } from '@/components/forms/calendar-form'

export default function CreateCalendarPage() {
  return <CalendarForm />
}
```

**Impact** : Navigation cohérente, no 404

---

#### 2.4 Cleanup imports (1h)

Script ou lint rule pour :
- Identifier imports inutilisés
- Activer `@typescript-eslint/no-unused-vars`

---

### 🎯 Phase 3 : Fonctionnalités avancées (Sprint 1-2)

#### 3.1 Implémenter RBAC frontend complet
- Masquer UI selon permissions
- Contexte React pour user + permissions
- Hooks `useCanDo(action, scope)`

#### 3.2 Intégration Supabase réelle
- Migrer données mock → BDD
- Implémenter create/update/delete
- Real-time listeners pour updates

#### 3.3 Notifications & Realtime
- Supabase Realtime listeners
- Notifications toast pour collaborations
- Update UI sans page refresh

---

## Roadmap proposée

### Sprint 0 : Stabilité (Semaine 1)

- [ ] ESLint config v9
- [ ] Google Fonts → local/fallback
- [ ] Lint + type-check CI
- [ ] Cleanup imports inutilisés
- [ ] Update middleware → proxy

**Livrables** : Build 100% reproductible, lint passe

---

### Sprint 1 : Refactor (Semaines 2-3)

- [ ] Split StrategicDashboard
- [ ] Déplacer mock data → `lib/mocks/`
- [ ] Implémenter stubs `/create/*`
- [ ] RBAC frontend basique

**Livrables** : Codebase modulaire, pages complètes

---

### Sprint 2 : Données réelles (Semaines 4-5)

- [ ] Supabase schema validation
- [ ] Convertir mock data → seed script
- [ ] Implémenter CRUD (create/update/delete)
- [ ] Unit tests sur services

**Livrables** : App connectée BDD, persisted data

---

### Sprint 3 : Collaboration (Semaines 6-7)

- [ ] Real-time subscriptions (Supabase)
- [ ] Chat notifications
- [ ] Check-in flows
- [ ] Performance optimizations

**Livrables** : App collaborative full-featured

---

### Sprint 4 : Production (Semaine 8+)

- [ ] Déploiement Vercel
- [ ] Performance monitoring
- [ ] Security review (RBAC, injection, CSRF)
- [ ] Documentation API

**Livrables** : Production-ready v1.0

---

## Checklist d'action immédiate

**[URGENT]** Cette semaine :
- [ ] Ajouter `eslint.config.mjs` + tester `pnpm lint`
- [ ] Remplacer Google Fonts imports par local fonts
- [ ] Vérifier `pnpm build` passe
- [ ] Créer branche `dev/stabilize` pour PR

**[COURT TERME]** Prochaine semaine :
- [ ] Découper `StrategicDashboard` en 4-5 sub-components
- [ ] Créer `lib/mocks/` et y déplacer données
- [ ] Implémenter pages `/create/calendar`, `/create/task`, etc.
- [ ] Tester navigation complète

**[BACKLOG]** Sprint 1+ :
- [ ] RBAC frontend masking
- [ ] Supabase integration réelle
- [ ] Real-time listeners
- [ ] E2E tests (Playwright)

---

## Conclusion

**ZORO PILOT** est un **MVP ambitieux et bien-conçu** avec une **excellente base produit** et **stack moderne**. L'application est proche de production, mais nécessite :

1. ✅ **Stabilité** : Lint + build robustes (priorité 1)
2. ✅ **Maintenabilité** : Refactor composants volumineux (priorité 2)
3. ✅ **Complétude** : Implémenter stub routes (priorité 2)
4. ✅ **Réalité** : Connecter vrai données Supabase (priorité 3)

**Estimation** : 6-8 semaines pour atteindre v1.0 production-ready avec une équipe de 2-3 devs.

---

*Rapport généré le 26 février 2026 par Copilot*
