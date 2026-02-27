// Central data store for Strategy + Execution fusion app
// Uses demo data to showcase full MVP functionality

export type RAGStatus = "on-track" | "at-risk" | "off-track"
export type Confidence = "on-track" | "at-risk" | "off-track"
export type TaskStatus = "todo" | "in-progress" | "blocked" | "done"
export type Priority = "low" | "medium" | "high" | "urgent"
export type KRType = "metric" | "initiative" | "manual"

// RBAC Role Types
export type RBACRole = "super_admin" | "admin" | "executive" | "manager" | "member" | "viewer"

export interface Organization {
  id: string
  name: string
}

export interface OrganizationMember {
  organizationId: string
  userId: string
  title: string
}

export interface Pillar {
  id: string
  name: string
  color: string
}

export interface Objective {
  id: string
  title: string
  pillarId: string
  ownerId: string
  period: string
  progress: number
  confidence: Confidence
  keyResults: KeyResult[]
}

export interface KeyResult {
  id: string
  objectiveId: string
  title: string
  type: KRType
  target: number
  current: number
  unit: string
  weight: number
  confidence: Confidence
  ownerId: string
}

export interface Project {
  id: string
  name: string
  teamId: string
  ownerId: string
  status: RAGStatus
  startDate: string
  endDate: string
  progress: number
  linkedObjectiveIds: string[]
  linkedKRIds: string[]
}

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  assigneeId: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  linkedKRId?: string
}

export interface OKRCheckin {
  id: string
  keyResultId: string
  date: string
  progressDelta: number
  confidence: Confidence
  note: string
  blocker?: string
}

export interface Team {
  id: string
  name: string
  memberIds: string[]
  parentTeamId?: string
  managerId: string
}

export interface User {
  id: string
  name: string
  role: string
  avatar: string
  teamId: string
  rbacRole: RBACRole
  managerId?: string
}

// --- CHAT & COLLABORATION TYPES ---

export type MessageType = "text" | "system" | "file" | "entity"

export type AttachmentKind = "image" | "video" | "file"

export interface MessageAttachment {
  kind: AttachmentKind
  name: string
  url: string
  mimeType?: string
}

export type EntityRefType = "project" | "task"

export interface MessageEntityRef {
  type: EntityRefType
  id: string
  title: string
}

export interface Message {
  id: string
  channelId: string
  senderId: string
  content: string
  timestamp: string
  type: MessageType
  attachments?: MessageAttachment[]
  entityRef?: MessageEntityRef
  replyToId?: string // For threading
  reactions?: Record<string, string[]> // emoji -> userIds
}

export interface Channel {
  id: string
  name: string
  type: "public" | "private" | "dm" | "context"
  memberIds: string[]
  organizationId?: string
  contextId?: string // ID of OKR, Project, Task if context-based
  contextType?: "objective" | "project" | "task"
}

// Formatage deterministe des nombres (evite les erreurs d'hydratation SSR)
const numberFmt = new Intl.NumberFormat("fr-FR")
const currencyFmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF", // Code ISO pour le Franc CFA (BCEAO)
  currencyDisplay: "symbol",
})

export function formatNumber(n: number): string {
  return numberFmt.format(n)
}

export function formatCurrency(n: number): string {
  // Le Franc CFA s'affiche souvent comme "FCFA" ou "F CFA"
  return currencyFmt.format(n).replace("XOF", "Fr CFA")
}

// Demo data
export const users: User[] = [
  { id: "u1", name: "Sarah Chen", role: "PDG", avatar: "SC", teamId: "t1", rbacRole: "admin", managerId: undefined },
  { id: "u2", name: "Marc Dubois", role: "VP Produit", avatar: "MD", teamId: "t2", rbacRole: "manager", managerId: "u1" },
  { id: "u3", name: "Amina Youssef", role: "Resp. Engineering", avatar: "AY", teamId: "t3", rbacRole: "manager", managerId: "u1" },
  { id: "u4", name: "Lucas Martin", role: "Designer", avatar: "LM", teamId: "t2", rbacRole: "member", managerId: "u2" },
  { id: "u5", name: "Fatima Benali", role: "Resp. Marketing", avatar: "FB", teamId: "t4", rbacRole: "manager", managerId: "u1" },
  { id: "u6", name: "Omar Kassim", role: "Developpeur", avatar: "OK", teamId: "t3", rbacRole: "member", managerId: "u3" },
]

export const teams: Team[] = [
  { id: "t1", name: "Direction", memberIds: ["u1"], managerId: "u1" },
  { id: "t2", name: "Produit", memberIds: ["u2", "u4"], parentTeamId: "t1", managerId: "u2" },
  { id: "t3", name: "Engineering", memberIds: ["u3", "u6"], parentTeamId: "t1", managerId: "u3" },
  { id: "t4", name: "Marketing", memberIds: ["u5"], parentTeamId: "t1", managerId: "u5" },
]

export const organizations: Organization[] = [
  { id: "org1", name: "TechFlow" },
  { id: "org2", name: "InnovateCorp" },
]

export const organizationMembers: OrganizationMember[] = [
  { organizationId: "org1", userId: "u1", title: "PDG" },
  { organizationId: "org1", userId: "u2", title: "VP Produit" },
  { organizationId: "org1", userId: "u3", title: "Resp. Engineering" },
  { organizationId: "org1", userId: "u4", title: "Designer" },
  { organizationId: "org1", userId: "u5", title: "Resp. Marketing" },
  { organizationId: "org1", userId: "u6", title: "Developpeur" },

  { organizationId: "org2", userId: "u1", title: "Conseil" },
  { organizationId: "org2", userId: "u2", title: "COO" },
]

// Demo Chat Data
export const channels: Channel[] = [
  { id: "c1", name: "General", type: "public", memberIds: ["u1", "u2", "u3", "u4", "u5", "u6"], organizationId: "org1" },
  { id: "c2", name: "Leadership", type: "private", memberIds: ["u1", "u2", "u3", "u5"], organizationId: "org1" },
  { id: "c3", name: "Project: MENA Launch", type: "context", memberIds: ["u1", "u4", "u5", "u6"], organizationId: "org1", contextId: "proj1", contextType: "project" },
  { id: "c4", name: "Objective: Platform v2.0", type: "context", memberIds: ["u3", "u6"], organizationId: "org1", contextId: "o2", contextType: "objective" },
  { id: "c5", name: "General", type: "public", memberIds: ["u1", "u2"], organizationId: "org2" },
]

export const messages: Message[] = [
  { id: "m1", channelId: "c1", senderId: "u1", content: "Bienvenue sur ZORO PILOT ! N'oubliez pas de mettre a jour vos OKR pour le T1.", timestamp: "2026-01-05T09:00:00Z", type: "text" },
  { id: "m2", channelId: "c3", senderId: "u5", content: "L'etude de marche est terminee. Les resultats sont prometteurs pour l'Egypte et l'Arabie Saoudite.", timestamp: "2026-01-20T14:30:00Z", type: "text" },
  { id: "m3", channelId: "c3", senderId: "u1", content: "Excellent ! On peut accelerer le recrutement du commercial ?", timestamp: "2026-01-20T14:45:00Z", type: "text", replyToId: "m2" },
  { id: "m4", channelId: "c4", senderId: "u6", content: "On a un souci de latence sur l'auth v2. Je regarde ca.", timestamp: "2026-02-16T10:00:00Z", type: "text" },
  { id: "m5", channelId: "c4", senderId: "u3", content: "Tiens moi au courant, ca bloque la release.", timestamp: "2026-02-16T10:05:00Z", type: "text", replyToId: "m4" },
]

export const pillars: Pillar[] = [
  { id: "p1", name: "Croissance", color: "chart-1" },
  { id: "p2", name: "Excellence Produit", color: "chart-2" },
  { id: "p3", name: "Equipe & Culture", color: "chart-5" },
]

export const objectives: Objective[] = [
  {
    id: "o1",
    title: "Etendre notre presence sur 3 nouvelles regions",
    pillarId: "p1",
    ownerId: "u1",
    period: "T1 2026",
    progress: 65,
    confidence: "on-track",
    keyResults: [
      { id: "kr1", objectiveId: "o1", title: "Atteindre 500 nouvelles inscriptions entreprise", type: "metric", target: 500, current: 340, unit: "inscriptions", weight: 40, confidence: "on-track", ownerId: "u5" },
      { id: "kr2", objectiveId: "o1", title: "Lancer dans la region MENA", type: "initiative", target: 100, current: 80, unit: "%", weight: 30, confidence: "on-track", ownerId: "u2" },
      { id: "kr3", objectiveId: "o1", title: "Atteindre 2M Fr CFA ARR nouvelles regions", type: "metric", target: 2000000, current: 1100000, unit: "Fr CFA", weight: 30, confidence: "at-risk", ownerId: "u1" },
    ],
  },
  {
    id: "o2",
    title: "Livrer la plateforme nouvelle generation v2.0",
    pillarId: "p2",
    ownerId: "u3",
    period: "T1 2026",
    progress: 45,
    confidence: "at-risk",
    keyResults: [
      { id: "kr4", objectiveId: "o2", title: "Finaliser la refonte API", type: "initiative", target: 100, current: 60, unit: "%", weight: 35, confidence: "at-risk", ownerId: "u3" },
      { id: "kr5", objectiveId: "o2", title: "Atteindre latence p95 < 200ms", type: "metric", target: 200, current: 280, unit: "ms", weight: 35, confidence: "off-track", ownerId: "u6" },
      { id: "kr6", objectiveId: "o2", title: "Atteindre 90% de couverture de tests", type: "metric", target: 90, current: 72, unit: "%", weight: 30, confidence: "at-risk", ownerId: "u3" },
    ],
  },
  {
    id: "o3",
    title: "Construire une culture d'equipe performante",
    pillarId: "p3",
    ownerId: "u1",
    period: "T1 2026",
    progress: 78,
    confidence: "on-track",
    keyResults: [
      { id: "kr7", objectiveId: "o3", title: "eNPS employes > 70", type: "metric", target: 70, current: 68, unit: "NPS", weight: 50, confidence: "on-track", ownerId: "u1" },
      { id: "kr8", objectiveId: "o3", title: "Former 15 managers au leadership", type: "metric", target: 15, current: 12, unit: "managers", weight: 50, confidence: "on-track", ownerId: "u1" },
    ],
  },
  {
    id: "o4",
    title: "Améliorer l'efficacité opérationnelle",
    pillarId: "p2",
    ownerId: "u1",
    period: "T1 2026",
    progress: 55,
    confidence: "on-track",
    keyResults: [],
  },
]

export interface KPI {
  id: string
  name: string
  value: number
  target: number
  unit: string
  trend: "up" | "down" | "stable"
  category: "finance" | "marketing" | "product" | "sales"
}

export const kpis: KPI[] = [
  { id: "k1", name: "MRR", value: 75000, target: 100000, unit: "Fr CFA", trend: "up", category: "finance" },
  { id: "k2", name: "Churn Rate", value: 2.4, target: 2.0, unit: "%", trend: "down", category: "marketing" },
  { id: "k3", name: "NPS", value: 45, target: 50, unit: "score", trend: "up", category: "product" },
]

export interface Integration {
  id: string
  name: string
  icon: string
  status: "connected" | "disconnected"
  description: string
}

export interface GmailMessage {
  id: string
  threadId: string
  subject: string
  snippet: string
  from: string
  date: string
  isRead: boolean
  labels: string[]
}

export const mockGmailMessages: GmailMessage[] = [
  { 
    id: "gm1", 
    threadId: "t1", 
    subject: "Re: Mise à jour du projet Pilot", 
    snippet: "Salut Menann, j'ai bien reçu les dernières specs. On peut se voir demain pour en discuter ?", 
    from: "Sarah Chen <sarah@example.com>", 
    date: "2026-02-25T10:30:00Z", 
    isRead: false, 
    labels: ["INBOX", "IMPORTANT"] 
  },
  { 
    id: "gm2", 
    threadId: "t2", 
    subject: "Facture Février 2026", 
    snippet: "Veuillez trouver ci-joint votre facture pour le mois de février. Le montant total est de...", 
    from: "Comptabilité <billing@cloud-services.com>", 
    date: "2026-02-24T15:45:00Z", 
    isRead: true, 
    labels: ["INBOX"] 
  },
  { 
    id: "gm3", 
    threadId: "t3", 
    subject: "Nouveau commentaire sur votre tâche", 
    snippet: "Marc Dubois a commenté: 'On a un petit retard sur le module auth, mais ça devrait aller.'", 
    from: "Zoro Notifications <no-reply@zoropilot.com>", 
    date: "2026-02-25T08:15:00Z", 
    isRead: false, 
    labels: ["INBOX", "ZORO"] 
  }
]

export const integrations: Integration[] = [
  { id: "i1", name: "Slack", icon: "Slack", status: "connected", description: "Notifications et check-ins via Slack" },
  { id: "i2", name: "Microsoft Teams", icon: "Teams", status: "disconnected", description: "Collaboration Teams intégrée" },
  { id: "i3", name: "Jira", icon: "Jira", status: "connected", description: "Synchronisation des tickets et tâches" },
  { id: "i4", name: "Asana", icon: "Asana", status: "disconnected", description: "Importation de projets et tâches" },
]

export const projects: Project[] = [
  {
    id: "proj1",
    name: "Lancement Region MENA",
    teamId: "t4",
    ownerId: "u5",
    status: "on-track",
    startDate: "2026-01-06",
    endDate: "2026-03-20",
    progress: 72,
    linkedObjectiveIds: ["o1"],
    linkedKRIds: ["kr2"],
  },
  {
    id: "proj2",
    name: "Refonte API v2",
    teamId: "t3",
    ownerId: "u3",
    status: "at-risk",
    startDate: "2026-01-13",
    endDate: "2026-03-28",
    progress: 45,
    linkedObjectiveIds: ["o2"],
    linkedKRIds: ["kr4", "kr5"],
  },
  {
    id: "proj3",
    name: "Parcours Onboarding Entreprise",
    teamId: "t2",
    ownerId: "u2",
    status: "on-track",
    startDate: "2026-02-01",
    endDate: "2026-03-15",
    progress: 60,
    linkedObjectiveIds: ["o1"],
    linkedKRIds: ["kr1"],
  },
  {
    id: "proj4",
    name: "Sprint Optimisation Performance",
    teamId: "t3",
    ownerId: "u6",
    status: "off-track",
    startDate: "2026-02-10",
    endDate: "2026-03-10",
    progress: 25,
    linkedObjectiveIds: ["o2"],
    linkedKRIds: ["kr5"],
  },
  {
    id: "proj5",
    name: "Programme Academie Leadership",
    teamId: "t1",
    ownerId: "u1",
    status: "on-track",
    startDate: "2026-01-15",
    endDate: "2026-03-30",
    progress: 80,
    linkedObjectiveIds: ["o3"],
    linkedKRIds: ["kr8"],
  },
]

export const tasks: Task[] = [
  // Lancement Region MENA
  { id: "task1", projectId: "proj1", title: "Rapport etude de marche - MENA", assigneeId: "u5", status: "done", priority: "high", dueDate: "2026-01-20", linkedKRId: "kr2" },
  { id: "task2", projectId: "proj1", title: "Localiser les pages (AR/FR)", assigneeId: "u4", status: "done", priority: "high", dueDate: "2026-02-01", linkedKRId: "kr2" },
  { id: "task3", projectId: "proj1", title: "Configurer passerelle paiement (Stripe MENA)", assigneeId: "u6", status: "in-progress", priority: "urgent", dueDate: "2026-02-15", linkedKRId: "kr2" },
  { id: "task4", projectId: "proj1", title: "Lancer campagne RP - MENA", assigneeId: "u5", status: "todo", priority: "medium", dueDate: "2026-03-01", linkedKRId: "kr2" },
  { id: "task5", projectId: "proj1", title: "Recruter commercial regional", assigneeId: "u1", status: "in-progress", priority: "high", dueDate: "2026-02-28", linkedKRId: "kr1" },
  // Refonte API v2
  { id: "task6", projectId: "proj2", title: "Concevoir nouveau schema API REST", assigneeId: "u3", status: "done", priority: "urgent", dueDate: "2026-01-25", linkedKRId: "kr4" },
  { id: "task7", projectId: "proj2", title: "Implementer middleware auth v2", assigneeId: "u6", status: "in-progress", priority: "high", dueDate: "2026-02-10", linkedKRId: "kr4" },
  { id: "task8", projectId: "proj2", title: "Migrer les schemas de base de donnees", assigneeId: "u3", status: "blocked", priority: "urgent", dueDate: "2026-02-20", linkedKRId: "kr4" },
  { id: "task9", projectId: "proj2", title: "Ecrire les tests d'integration", assigneeId: "u6", status: "todo", priority: "high", dueDate: "2026-03-05", linkedKRId: "kr6" },
  { id: "task10", projectId: "proj2", title: "Suite de benchmarks performance", assigneeId: "u3", status: "todo", priority: "medium", dueDate: "2026-03-15", linkedKRId: "kr5" },
  // Parcours Onboarding Entreprise
  { id: "task11", projectId: "proj3", title: "Maquettes wireframes onboarding", assigneeId: "u4", status: "done", priority: "high", dueDate: "2026-02-05" },
  { id: "task12", projectId: "proj3", title: "Construire formulaire multi-etapes", assigneeId: "u6", status: "in-progress", priority: "high", dueDate: "2026-02-20", linkedKRId: "kr1" },
  { id: "task13", projectId: "proj3", title: "Integration SSO (SAML)", assigneeId: "u3", status: "todo", priority: "urgent", dueDate: "2026-03-01", linkedKRId: "kr1" },
  { id: "task14", projectId: "proj3", title: "Tableau de bord analytics utilisateurs", assigneeId: "u4", status: "todo", priority: "medium", dueDate: "2026-03-10" },
  // Sprint Optimisation Performance
  { id: "task15", projectId: "proj4", title: "Profiler les goulots d'etranglement API", assigneeId: "u6", status: "in-progress", priority: "urgent", dueDate: "2026-02-18", linkedKRId: "kr5" },
  { id: "task16", projectId: "proj4", title: "Implementer couche de cache (Redis)", assigneeId: "u3", status: "blocked", priority: "high", dueDate: "2026-02-25", linkedKRId: "kr5" },
  { id: "task17", projectId: "proj4", title: "Optimisation des requetes BDD", assigneeId: "u6", status: "todo", priority: "high", dueDate: "2026-03-05", linkedKRId: "kr5" },
  // Programme Academie Leadership
  { id: "task18", projectId: "proj5", title: "Definir le programme de formation", assigneeId: "u1", status: "done", priority: "high", dueDate: "2026-01-25", linkedKRId: "kr8" },
  { id: "task19", projectId: "proj5", title: "Reserver les formateurs externes", assigneeId: "u1", status: "done", priority: "medium", dueDate: "2026-02-01", linkedKRId: "kr8" },
  { id: "task20", projectId: "proj5", title: "Animer les sessions cohorte 3", assigneeId: "u1", status: "in-progress", priority: "high", dueDate: "2026-03-15", linkedKRId: "kr8" },
]

export const checkins: OKRCheckin[] = [
  { id: "ci1", keyResultId: "kr1", date: "2026-02-17", progressDelta: 8, confidence: "on-track", note: "Pipeline d'onboarding en croissance reguliere. 40 nouvelles inscriptions cette semaine." },
  { id: "ci2", keyResultId: "kr1", date: "2026-02-10", progressDelta: 12, confidence: "on-track", note: "Campagne A performante, +52 inscriptions." },
  { id: "ci3", keyResultId: "kr4", date: "2026-02-17", progressDelta: 5, confidence: "at-risk", note: "Migration BDD bloquee par les dependances du schema legacy.", blocker: "Migration schema legacy bloquee - en attente de la revue DBA" },
  { id: "ci4", keyResultId: "kr5", date: "2026-02-17", progressDelta: -2, confidence: "off-track", note: "Latence en hausse apres le deploiement. Rollback en cours.", blocker: "Investigation fuite memoire dans le service auth necessaire" },
  { id: "ci5", keyResultId: "kr7", date: "2026-02-17", progressDelta: 3, confidence: "on-track", note: "Derniere enquete montre une amelioration de la satisfaction." },
  { id: "ci6", keyResultId: "kr8", date: "2026-02-17", progressDelta: 2, confidence: "on-track", note: "Cohorte 3 demarree cette semaine. 12 managers sur 15 inscrits." },
  { id: "ci7", keyResultId: "kr2", date: "2026-02-17", progressDelta: 10, confidence: "on-track", note: "Integration passerelle de paiement en bonne voie. Localisation a 90%." },
  { id: "ci8", keyResultId: "kr3", date: "2026-02-17", progressDelta: 5, confidence: "at-risk", note: "Revenus plus lents que prevu. Acceleration du pipeline commercial necessaire." },
]

// =========================================================================
// RBAC Helper functions
// =========================================================================

export function getRoleLabel(role: RBACRole): string {
  switch (role) {
    case "super_admin": return "Propriétaire"
    case "admin": return "Administrateur"
    case "executive": return "Direction"
    case "manager": return "Manager"
    case "member": return "Membre"
    case "viewer": return "Lecteur"
    default: return "Membre"
  }
}

export function getRoleBadgeColor(role: RBACRole): string {
  switch (role) {
    case "super_admin": return "bg-primary/20 text-primary border border-primary/30"
    case "admin": return "bg-destructive/15 text-destructive"
    case "executive": return "bg-chart-5/15 text-chart-5"
    case "manager": return "bg-primary/15 text-primary"
    case "member": return "bg-success/15 text-success"
    case "viewer": return "bg-muted text-muted-foreground"
    default: return "bg-muted text-muted-foreground"
  }
}

/** Get all direct and indirect subordinates of a user (recursive) */
export function getSubordinates(userId: string): User[] {
  const directs = users.filter((u) => u.managerId === userId)
  const allSubs: User[] = [...directs]
  for (const d of directs) {
    allSubs.push(...getSubordinates(d.id))
  }
  return allSubs
}

/** Get all user IDs in a user's scope (self + subordinates) */
export function getScopeUserIds(userId: string): string[] {
  return [userId, ...getSubordinates(userId).map((u) => u.id)]
}

/** Check if a viewer can see content owned by targetOwnerId */
export function canView(viewer: User, targetOwnerId: string): boolean {
  if (viewer.rbacRole === "admin" || viewer.rbacRole === "executive") return true
  if (viewer.rbacRole === "manager") {
    const scope = getScopeUserIds(viewer.id)
    return scope.includes(targetOwnerId)
  }
  if (viewer.rbacRole === "member") {
    return viewer.id === targetOwnerId
  }
  // viewer role: can only see shared items — for demo, viewers can see everything in read-only
  return true
}

/** Check if an actor can edit content owned by targetOwnerId */
export function canEdit(actor: User, targetOwnerId: string): boolean {
  if (actor.rbacRole === "admin" || actor.rbacRole === "executive") return true
  if (actor.rbacRole === "manager") {
    const scope = getScopeUserIds(actor.id)
    return scope.includes(targetOwnerId)
  }
  if (actor.rbacRole === "member") {
    return actor.id === targetOwnerId
  }
  return false // viewer cannot edit
}

/** Check if an actor can approve/validate content from targetOwnerId */
export function canApprove(actor: User, targetOwnerId: string): boolean {
  if (actor.rbacRole === "admin" || actor.rbacRole === "executive") return true
  if (actor.rbacRole === "manager") {
    const scope = getScopeUserIds(actor.id)
    return scope.includes(targetOwnerId)
  }
  return false
}

/** Can the user create OKRs? */
export function canCreateOKR(user: User): boolean {
  return user.rbacRole === "admin" || user.rbacRole === "executive" || user.rbacRole === "manager"
}

/** Can the user submit check-ins? */
export function canCheckin(user: User): boolean {
  return user.rbacRole !== "viewer"
}

/** Can the user access settings/admin? */
export function canAccessSettings(user: User): boolean {
  return user.rbacRole === "admin"
}

/** Can the user view reports? */
export function canAccessReports(user: User): boolean {
  return user.rbacRole !== "viewer"
}

/** Get visible objectives for a user based on their role */
export function getVisibleObjectives(userId: string): Objective[] {
  const user = getUserById(userId)
  if (!user) return []
  if (user.rbacRole === "admin" || user.rbacRole === "executive" || user.rbacRole === "viewer") {
    return objectives
  }
  const scope = getScopeUserIds(userId)
  return objectives.filter((o) => {
    // Objective is visible if owned by someone in scope or has KRs owned by someone in scope
    if (scope.includes(o.ownerId)) return true
    return o.keyResults.some((kr) => scope.includes(kr.ownerId))
  })
}

/** Get visible projects for a user based on their role */
export function getVisibleProjects(userId: string): Project[] {
  const user = getUserById(userId)
  if (!user) return []
  if (user.rbacRole === "admin" || user.rbacRole === "executive" || user.rbacRole === "viewer") {
    return projects
  }
  const scope = getScopeUserIds(userId)
  return projects.filter((p) => {
    if (scope.includes(p.ownerId)) return true
    // Also visible if the project's team has members in scope
    const team = getTeamById(p.teamId)
    if (team && team.memberIds.some((mid) => scope.includes(mid))) return true
    return false
  })
}

/** Get visible tasks for a user based on their role */
export function getVisibleTasks(userId: string): Task[] {
  const user = getUserById(userId)
  if (!user) return []
  if (user.rbacRole === "admin" || user.rbacRole === "executive" || user.rbacRole === "viewer") {
    return tasks
  }
  const scope = getScopeUserIds(userId)
  return tasks.filter((t) => scope.includes(t.assigneeId))
}

// =========================================================================
// General helper functions
// =========================================================================

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function getTeamById(id: string): Team | undefined {
  return teams.find((t) => t.id === id)
}

export function getProjectsByObjective(objectiveId: string): Project[] {
  return projects.filter((p) => p.linkedObjectiveIds.includes(objectiveId))
}

export function getTasksByProject(projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId)
}

export function getCheckinsByKR(krId: string): OKRCheckin[] {
  return checkins.filter((c) => c.keyResultId === krId)
}

export function getRAGColor(status: RAGStatus | Confidence): string {
  switch (status) {
    case "on-track": return "text-success"
    case "at-risk": return "text-warning"
    case "off-track": return "text-destructive"
  }
}

export function getRAGBg(status: RAGStatus | Confidence): string {
  switch (status) {
    case "on-track": return "bg-success/15 text-success"
    case "at-risk": return "bg-warning/15 text-warning"
    case "off-track": return "bg-destructive/15 text-destructive"
  }
}

export function getStatusLabel(status: RAGStatus | Confidence): string {
  switch (status) {
    case "on-track": return "En bonne voie"
    case "at-risk": return "A risque"
    case "off-track": return "En retard"
  }
}

export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case "urgent": return "Urgent"
    case "high": return "Haute"
    case "medium": return "Moyenne"
    case "low": return "Basse"
  }
}

export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "todo": return "A faire"
    case "in-progress": return "En cours"
    case "blocked": return "Bloque"
    case "done": return "Termine"
  }
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case "urgent": return "bg-destructive/15 text-destructive"
    case "high": return "bg-warning/15 text-warning"
    case "medium": return "bg-primary/15 text-primary"
    case "low": return "bg-muted text-muted-foreground"
  }
}

export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case "done": return "bg-success/15 text-success"
    case "in-progress": return "bg-primary/15 text-primary"
    case "blocked": return "bg-destructive/15 text-destructive"
    case "todo": return "bg-muted text-muted-foreground"
  }
}

// --- CHAT HELPERS ---

export function getChannelById(id: string): Channel | undefined {
  return channels.find(c => c.id === id)
}

export function getOrganizationById(id: string): Organization | undefined {
  return organizations.find((o) => o.id === id)
}

export function getUserOrganizationIds(userId: string): string[] {
  return organizationMembers.filter((m) => m.userId === userId).map((m) => m.organizationId)
}

export function getUserOrgTitle(userId: string, organizationId?: string): string | undefined {
  if (!organizationId) return undefined
  return organizationMembers.find((m) => m.userId === userId && m.organizationId === organizationId)?.title
}

export function getChannelMessages(channelId: string): Message[] {
  return messages.filter(m => m.channelId === channelId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

export function getUserChannels(userId: string): Channel[] {
  return channels.filter(c => c.memberIds.includes(userId))
}

export function getContextChannel(contextId: string): Channel | undefined {
  return channels.find(c => c.contextId === contextId)
}

