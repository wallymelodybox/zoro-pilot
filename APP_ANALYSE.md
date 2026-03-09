# Analyse de l'application ZORO PILOT

## Vue d'ensemble

ZORO PILOT est une application Next.js (App Router) orientée **pilotage stratégique + exécution opérationnelle**. L'application combine:

- un tableau de bord stratégique visuel (OKR/KPI/RAG),
- une navigation par espaces métier (stratégie, travail, calendrier, performance, etc.),
- une couche d'authentification/permissions basée sur Supabase,
- un jeu de données de démonstration riche pour simuler les parcours produit.

## Stack technique

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4 + composants Radix/UI
- **Data/Auth**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Visualisation**: Recharts
- **Typage**: TypeScript

## Architecture applicative

### 1) Couche de routage / pages

Le répertoire `app/` expose une structure multi-sections claire: `strategy`, `work`, `calendar`, `my-day`, `all-tasks`, `performance`, `settings`, etc. La page d'accueil (`/`) délègue au composant `StrategicDashboard`.

### 2) Shell d'application

Le composant `AppShell` applique deux modes:

- page d'accueil (`/`) en mode plein écran sans sidebar globale,
- autres routes avec sidebar latérale partagée.

Ce choix permet une homepage immersive tout en gardant une navigation standard ailleurs.

### 3) Domaine métier centralisé

`lib/store.ts` concentre des types métier et des données mock:

- OKR (objectifs, key results, check-ins),
- projets/tâches,
- équipes/utilisateurs,
- chat/canaux,
- KPI/integrations.

C'est utile pour un MVP démonstratif, mais la séparation "types / données / services" pourrait être renforcée pour la scalabilité.

### 4) Authentification et RBAC

- Proxy Next + Supabase SSR (`proxy.ts`, `lib/supabase/middleware.ts`) pour maintenir la session.
- Couche RBAC dédiée (`lib/rbac.ts`) avec support des scopes `organization` et `project`.

La logique RBAC est bien amorcée, avec des vérifications de permissions par action/scope.

## Points forts

1. **Vision produit cohérente**: la promesse "stratégie ↔ exécution" est reflétée partout dans la navigation et les données.
2. **Socle UI moderne**: composants Radix + Tailwind + design system existant (`components/ui/*`).
3. **Typage métier étendu**: bonne base TypeScript pour structurer les futurs services.
4. **RBAC déjà pensée tôt**: bonne pratique pour une app B2B orientée organisation.

## Risques et dettes techniques identifiés

1. **Lint non fonctionnel en l'état**
   - Le script `pnpm lint` échoue car ESLint v9 requiert `eslint.config.*` (absent).
   - Impact: baisse de garde-fou qualité (style, erreurs statiques, conventions).

2. **Build dépendant à Google Fonts (réseau)**
   - `pnpm build` échoue faute d'accès à `fonts.googleapis.com` (Inter, JetBrains Mono via `next/font/google`).
   - Impact: builds CI/CD fragiles en environnements restreints.

3. **Middleware Next déprécié**
   - Avertissement Next 16: convention `middleware` dépréciée au profit de `proxy`.
   - Impact: dette de compatibilité future.

4. **Composants volumineux**
   - `components/strategic-dashboard.tsx` est très dense (UI, données de présentation, interactions dans un même fichier).
   - Impact: maintenance/testabilité plus difficiles.

5. **Imports potentiellement inutilisés**
   - Ex. `ChatPanel`, `ThemeToggle`, et certains icônes semblent importés sans usage dans la sidebar.
   - Impact: bruit code + dette de lisibilité.

## Recommandations prioritaires

### Priorité haute (stabilité)

1. Ajouter une configuration ESLint moderne (`eslint.config.mjs`) compatible Next + TypeScript.
2. Sécuriser le build hors-ligne en remplaçant `next/font/google` par:
   - `next/font/local`, ou
   - une stratégie de fallback robuste si le réseau est indisponible.
3. Planifier migration `middleware` -> `proxy` pour anticiper les prochaines versions Next.

### Priorité moyenne (maintenabilité)

1. Découper `StrategicDashboard` en sous-composants:
   - layout, widgets KPI, graphiques, barres d'actions, sidebar spécifique.
2. Isoler les données mock dans des modules dédiés (`lib/mocks/*`) et conserver `lib/store.ts` pour les types et sélecteurs.
3. Activer des contrôles CI minimaux: `typecheck`, `lint`, `build`.

### Priorité produit

1. Clarifier la stratégie d'auth actuelle:
   - le middleware autorise implicitement l'accès (commentaires de redirection désactivés),
   - définir explicitement mode "demo" vs mode "secure".
2. Aligner la sidebar et les routes réelles (éviter les liens vers pages absentes).

## Conclusion

L'application présente un **MVP solide et ambitieux** avec une excellente base UX/produit pour un cockpit stratégique. La prochaine étape consiste surtout à **industrialiser le socle technique** (lint/build robustes, découpage composants, migration conventions Next) pour passer d'une démo avancée à une base de production durable.
