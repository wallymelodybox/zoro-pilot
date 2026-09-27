# Audit de l'isolation multi-tenant de Zoro Pilote

Date : 27 septembre 2026  
Périmètre : dépôt web canonique `zoro-pilot`, migrations Supabase, Server Actions, Route Handlers, stockage et modèle d'appartenance.

## Résumé exécutif

> État de remédiation du 27 septembre 2026 : ISO-001, ISO-002, ISO-004 et
> ISO-007 ont maintenant des corrections locales dans les migrations
> `20260927000001` à `20260927000004`. Elles restent à déployer et tester sur
> la base cible. ISO-003 (buckets privés), ISO-005, ISO-006, ISO-008, ISO-009
> et ISO-010 restent ouverts.

L'isolation est **partiellement implémentée**, mais le niveau actuel ne permet pas encore d'affirmer que les organisations sont totalement cloisonnées.

Les projets, tâches, événements, documents enregistrés en base, commentaires, CRM, finances et plusieurs paramètres disposent d'un rattachement organisationnel et de politiques RLS. L'accès par membre de projet existe aussi via `project_members` et `can_view_project()`.

Cependant, quatre failles prioritaires empêchent de considérer l'architecture comme sûre :

1. les tables RBAC historiques (`roles`, `permissions`, `role_permissions`, `user_roles`) n'activent pas RLS dans les migrations ;
2. plusieurs politiques de chat « demo » autorisent encore des lectures ou écritures publiques ;
3. les pièces jointes de chat et documents de projet sont stockés dans des buckets publics ;
4. l'acceptation d'invitation utilise la clé `service_role` sans vérifier côté serveur l'utilisateur connecté ni l'adresse invitée.

Le multi-organisation par compte n'est pas encore réellement pris en charge : `profiles.organization_id` et `user_org_id()` représentent une seule organisation active et aucune sélection d'espace de travail n'est implémentée.

## État par niveau d'isolation

| Niveau attendu | État | Constat |
|---|---|---|
| Compte utilisateur | Partiel | Supabase Auth est utilisé, mais l'action d'acceptation d'invitation fait confiance à des paramètres client. |
| Organisation | Partiel | `organization_id` et de nombreuses policies existent, mais certaines tables et policies historiques restent ouvertes. |
| Programme | Partiel | Les programmes sont filtrés par organisation, mais tous les membres de l'organisation peuvent en lire les métadonnées. |
| Projet | Implémenté avec réserves | `project_members` et `can_view_project()` filtrent les lectures ; les écritures ne sont pas toutes alignées avec les permissions métier. |
| Tâches | Implémenté avec réserves | Organisation, visibilité, créateur, assignés multiples et projet sont vérifiés pour la lecture. |
| Fichiers | Non conforme | Buckets publics et URLs publiques contournent l'isolation RLS des métadonnées. |
| Messages | Non conforme | Anciennes policies publiques et bucket public. |
| Finance/CRM | Globalement implémenté | Tables rattachées à l'organisation et CRUD couvert par RLS ; tests inter-organisations encore requis. |
| Multi-organisation par compte | Absent | Une seule organisation active dans le profil ; pas de contexte sélectionnable par session. |
| Super Admin | Non conforme à la cible | Plusieurs policies lui donnent accès aux contenus métiers, pas seulement aux métadonnées SaaS. |

## Constatations critiques

### ISO-001 — Tables RBAC sans RLS visible

- Sévérité : **Critique**
- Emplacement : `supabase/migrations/20240101000000_rbac_setup.sql:4-40`
- Preuve : les tables `roles`, `permissions`, `role_permissions` et `user_roles` sont créées, mais aucune instruction `enable row level security` ni policy correspondante n'apparaît dans l'historique des migrations.
- Impact : selon les privilèges SQL réellement accordés dans l'instance, un utilisateur authentifié pourrait lire ou modifier des attributions de rôles, puis obtenir des permissions organisationnelles ou projet.
- Correction : activer et forcer RLS sur ces quatre tables ; rendre le catalogue des rôles lisible si nécessaire, mais réserver l'écriture des attributions aux administrateurs autorisés de l'organisation et vérifier le `scope_id`.
- Mitigation : révoquer immédiatement les droits d'écriture `anon` et `authenticated` tant que les policies finales ne sont pas déployées.
- À vérifier en production : `pg_class.relrowsecurity`, `information_schema.role_table_grants` et `pg_policies`.

### ISO-002 — Policies publiques héritées du chat

- Sévérité : **Critique**
- Emplacements :
  - `supabase/migrations/20240227000002_chat_rls_policies.sql:14-37`
  - `supabase/migrations/20240227000001_chat_supabase.sql:19-24`
- Preuve : `Channels Public Read` et `Channel Members Public Read` utilisent `using (true)` ; `Channels Auth Insert` ne vérifie ni organisation ni créateur ; `message_user_state` autorise lecture, insertion et mise à jour avec `true`. Aucune migration ultérieure ne supprime explicitement ces policies nommées.
- Impact : les policies PostgreSQL permissives sont combinées avec `OR`. Une policy plus stricte ajoutée ensuite ne neutralise donc pas une ancienne policy `using (true)`. Des canaux, appartenances et états de lecture peuvent être exposés ou manipulés entre organisations.
- Correction : supprimer toutes les policies « Public »/« Auth Insert » héritées et recréer des policies basées sur l'organisation, l'appartenance au canal et `auth.uid()`.
- Mitigation : suspendre temporairement les mutations de canaux côté client ne suffit pas ; la correction doit être en base.

### ISO-003 — Stockage public des documents et médias

- Sévérité : **Critique**
- Emplacements :
  - `supabase/migrations/20260715020000_project_documents_storage.sql:2-23`
  - `supabase/migrations/20240227000001_chat_supabase.sql:26-50`
  - `app/work/page.tsx:1499-1524`
  - `app/chats/page.tsx:271-276`
- Preuve : les buckets `project-documents` et `chat-media` sont publics ; leurs objets ont une policy de lecture sans contrôle d'organisation. Les clients utilisent `getPublicUrl()`.
- Impact : toute personne connaissant ou recevant une URL peut télécharger un document même sans session, sans appartenance à l'organisation ou au projet. Les métadonnées RLS de `project_documents` ne protègent pas le fichier lui-même.
- Correction : rendre les buckets privés ; adopter un chemin `organization_id/project_id/user_id/...` ; valider l'accès par RLS sur `storage.objects` ; générer des URLs signées courtes uniquement après autorisation serveur.
- Mitigation : utiliser des noms aléatoires limite seulement la découverte et ne constitue pas une autorisation.

### ISO-004 — Acceptation d'invitation avec `service_role` fondée sur des valeurs client

- Sévérité : **Critique**
- Emplacement : `app/invite/[token]/actions.ts:19-75`
- Preuve : `finalizeInviteAcceptance(token, userId, email, name)` ne récupère pas la session avec `auth.getUser()`. Le `userId` et l'email reçus sont utilisés par le client administrateur pour modifier `profiles`, `organization_members` et `invites`. L'email n'est pas comparé à `invite.invited_email`.
- Impact : avec un token/code valide, un appelant peut tenter d'associer un identifiant utilisateur choisi à une organisation et contourner RLS grâce à la clé `service_role`.
- Correction : récupérer l'utilisateur exclusivement depuis la session serveur ; ignorer tout `userId`/email fourni ; comparer l'email normalisé à l'invitation ; consommer l'invitation atomiquement et vérifier le nombre de lignes mises à jour.
- Mitigation : tokens longs, expiration courte et usage unique, mais cela ne remplace pas la liaison à l'identité authentifiée.

## Constatations élevées

### ISO-005 — Modèle multi-organisation par compte absent

- Sévérité : **Élevée**
- Emplacements :
  - `supabase/migrations/20240228000001_rls_org_isolation.sql:23-31`
  - `hooks/use-user.ts:15-139`
  - `hooks/use-supabase.ts:41-91`
- Preuve : `user_org_id()` retourne `profiles.organization_id`, donc une seule organisation ; les chargements client utilisent ce même identifiant. `organization_members` peut représenter plusieurs liens mais n'est pas utilisé comme contexte actif.
- Impact : un DG multi-organisation ne peut pas changer proprement d'espace ; modifier `profiles.organization_id` pour simuler le changement crée des risques de concurrence, d'audit et de mélange de contexte entre onglets/appareils.
- Correction : créer un contexte d'organisation active validé côté serveur parmi les adhésions de l'utilisateur, puis faire dépendre les helpers RLS de cette adhésion/contexte. Ne jamais accepter directement un `organization_id` arbitraire du client.

### ISO-006 — Super Admin autorisé à lire des contenus métiers

- Sévérité : **Élevée** par rapport au modèle demandé
- Emplacements :
  - `supabase/migrations/20260927000000_programs_and_member_visibility.sql:94-129`
  - `supabase/migrations/20260821000002_project_membership_confidentiality.sql:80-95`
  - `supabase/migrations/20240228000007_security_hardening.sql:81-92`
- Preuve : `is_super_admin()` autorise explicitement la lecture des projets, événements, documents enregistrés en base et messages.
- Impact : un compte plateforme compromis ou utilisé sans justification peut consulter des données client, contrairement à la séparation « métadonnées SaaS uniquement » souhaitée.
- Correction : retirer le bypass super admin des contenus métiers. Prévoir, si nécessaire, un accès support temporaire, audité, justifié, limité à une organisation et approuvé.

### ISO-007 — Création de projet non alignée avec les rôles annoncés

- Sévérité : **Élevée**
- Emplacement : `supabase/migrations/20260927000001_fix_project_creation_rls.sql:12-42`
- Preuve : tout membre authentifié de l'organisation peut créer un projet et s'attribuer le rôle propriétaire ; `can_manage_org_projects()` ou une permission `create_project` n'est pas exigée.
- Impact : un collaborateur ou invité peut potentiellement créer des projets et devenir propriétaire, alors que le modèle fonctionnel réserve normalement cette capacité aux rôles autorisés.
- Correction : exiger une permission serveur explicite (`can_manage_org_projects()` ou permission RBAC organisationnelle fiable) et masquer le bouton côté UI uniquement en complément.
- Note : cette policy corrige l'erreur fonctionnelle de création, mais élargit volontairement l'autorisation ; il faut trancher la règle métier avant son déploiement.

### ISO-008 — Tables de liaison historiques sans isolation démontrée

- Sévérité : **Élevée**
- Emplacement : `supabase/migrations/20231231000000_initial_schema.sql:96-106`
- Preuve : `project_objectives` et `project_key_results` sont créées sans `organization_id` et sans activation RLS visible dans les migrations.
- Impact : exposition ou manipulation de relations inter-projets/objectifs si les grants publics sont actifs ; possibilité de lier des objets de tenants différents sans contrainte composée.
- Correction : activer RLS, vérifier l'accès aux deux ressources parentes, empêcher toute liaison entre organisations via trigger/contrainte ou RPC sécurisée.

## Constatations moyennes

### ISO-009 — Programmes visibles à toute l'organisation

- Sévérité : **Moyenne**
- Emplacement : `supabase/migrations/20260927000000_programs_and_member_visibility.sql:32-38`
- Preuve : la lecture vérifie seulement `organization_id`, sans appartenance à un programme ou à au moins un projet du programme.
- Impact : un collaborateur peut voir le nom, le statut et l'existence de programmes confidentiels même s'il ne voit aucun de leurs projets.
- Correction : définir la confidentialité attendue des programmes et ajouter `program_members`, ou autoriser la lecture seulement aux managers et membres d'au moins un projet rattaché.

### ISO-010 — Isolation prouvée par code, pas par tests adversariaux

- Sévérité : **Moyenne**
- Preuve : aucune suite de tests RLS inter-organisations n'a été identifiée ; la CLI Supabase retourne actuellement `401 Unauthorized`, donc l'état déployé ne peut pas être comparé aux migrations locales.
- Impact : dérive possible entre le dépôt et la base en production ; une policy manquante ou ancienne peut annuler l'isolation attendue.
- Correction : ajouter une matrice automatisée avec utilisateurs ORG-A/ORG-B, DG/manager/membre/invité, projets membre/non-membre, ainsi que tests d'ID connus pour SELECT/INSERT/UPDATE/DELETE et Storage.

## Points correctement implémentés

- Les entités principales reçoivent progressivement un `organization_id` (`20240228000005_direct_org_isolation.sql:4-39`).
- Les projets ont une lecture filtrée par organisation et appartenance projet (`20260927000000_programs_and_member_visibility.sql:94-129`).
- Les tâches combinent organisation, visibilité, créateur, assignés multiples et accès au projet (`20260927000000_programs_and_member_visibility.sql:131-151`).
- Les commentaires de tâches contrôlent l'organisation, la tâche et l'accès projet (`20260927000000_programs_and_member_visibility.sql:153-221`).
- Le CRM possède des policies organisationnelles CRUD (`20240228000008_crm_tables.sql:116-210`).
- Les finances ont reçu des policies organisationnelles après une phase initiale sans policies (`20260810000001_finance_rls_policies.sql:1-88`).
- Les appels LiveKit vérifient la session et l'accès au canal avant d'émettre un jeton (`app/chats/call-actions.ts:6-32`).
- Le checkout mobile vérifie le jeton Supabase, charge l'organisation depuis le profil serveur et contrôle le rôle (`app/api/billing/checkout/route.ts:23-67`).
- Le webhook Stripe vérifie sa signature avant toute mutation (`app/api/stripe/webhook/route.ts:31-54`).

## Ordre de correction recommandé

1. Fermer les policies publiques du chat et sécuriser `message_user_state`.
2. Sécuriser l'action d'acceptation d'invitation.
3. Activer/verrouiller RLS sur RBAC et tables de liaison historiques.
4. Passer les buckets documents/chat en privé et migrer vers des URLs signées.
5. Décider qui peut créer un projet puis aligner RLS et interface.
6. Retirer l'accès contenu du Super Admin.
7. Concevoir le vrai contexte multi-organisation.
8. Déployer et exécuter la matrice de tests adversariaux sur la base cible.

## Limites de l'audit

Cet audit porte sur les migrations et le code présents dans le dépôt. Il ne confirme pas l'état réel de la base hébergée : la CLI Supabase échoue actuellement avec `401 Unauthorized`. Une vérification de `pg_policies`, des grants, des buckets et de tests avec plusieurs comptes reste indispensable après réauthentification.
