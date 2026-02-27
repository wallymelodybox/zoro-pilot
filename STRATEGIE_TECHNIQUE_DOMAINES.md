# Stratégie Technique : Séparation des Domaines Zoro Pilot

Ce document détaille l'architecture et les procédures pour gérer indépendamment le domaine de l'application cliente et le domaine du Back Office (BO) sur une infrastructure Vercel + Supabase.

## 1. Architecture de Routage (Middleware)

L'isolation est gérée au niveau de la couche "Edge" de Vercel via le fichier `middleware.ts`. 

### Principes de fonctionnement :
- **Domaine Client (`APP_DOMAIN`)** : Accès réservé aux fonctionnalités utilisateurs. Toute tentative d'accès au chemin `/bo-zoro-control-2026-secure` depuis ce domaine retourne une erreur **403 Forbidden**.
- **Domaine Admin (`ADMIN_DOMAIN`)** : Accès réservé à l'administration. La racine (`/`) est réécrite de manière transparente vers `/bo-zoro-control-2026-secure`. Les autres chemins non liés à l'administration ou à l'authentification sont redirigés vers le login.

## 2. Configuration DNS & Vercel

### Étape 1 : Domaine Principal (Application)
1. Dans le dashboard Vercel, allez dans **Settings > Domains**.
2. Ajoutez `app.zoro-pilot.com` (ou votre domaine choisi).
3. Suivez les instructions pour configurer les enregistrements A ou CNAME chez votre registraire (ex: Namecheap, OVH).
4. Vercel générera automatiquement le certificat SSL.

### Étape 2 : Sous-domaine Back Office (Admin)
1. Dans le même projet Vercel, ajoutez un second domaine : `zoro-secure-control-net.com`.
2. **Important** : Ne pas rediriger ce domaine vers le premier. Il doit être configuré comme un domaine indépendant pointant vers le même projet.
3. Configurez les DNS de la même manière.

## 3. Variables d'Environnement (Vercel)

Pour que le routage fonctionne, configurez les variables suivantes dans Vercel (**Settings > Environment Variables**) :

| Variable | Valeur (Exemple) | Portée |
| :--- | :--- | :--- |
| `APP_DOMAIN` | `app.zoro-pilot.com` | Production |
| `ADMIN_DOMAIN` | `zoro-secure-control-net.com` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `votre_cle_secrete` | Production (Secret) |

*Note : Ces variables ne doivent pas avoir le préfixe `NEXT_PUBLIC_` pour rester invisibles côté client.*

## 4. Authentification & Sécurité

### Isolation Supabase
1. **Redirect URLs** : Ajoutez `https://zoro-secure-control-net.com/**` dans **Supabase > Auth > URL Configuration**.
2. **RBAC** : La sécurité finale repose sur le rôle `rbac_role` dans la table `profiles`. Le middleware vérifie la session, mais la page admin vérifie explicitement le rôle `super_admin`.

### Tests de Validation
- [ ] Accéder à `app.zoro-pilot.com/bo-zoro-control-2026-secure` -> Doit renvoyer **403**.
- [ ] Accéder à `zoro-secure-control-net.com` -> Doit afficher le Dashboard Admin (après login).
- [ ] Inspecter le code source (Network tab) -> Aucune trace de l'URL admin ne doit apparaître sur le domaine client.

## 5. Maintenance Évolutive
- Pour ajouter une nouvelle zone (ex: `api.domaine.com`), il suffit d'ajouter une condition dans le middleware et de déclarer le nouveau domaine dans Vercel.
- La base de code reste unique, facilitant les mises à jour de sécurité globales.
