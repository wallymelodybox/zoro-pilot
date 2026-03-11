"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  Building2,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  StickyNote,
  Plus,
  Search,
  MoreHorizontal,
  DollarSign,
  Target,
  Activity,
  UserPlus,
  Briefcase,
  Globe,
  MapPin,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  BarChart3,
  Trash2,
  Edit2,
  Eye,
  ChevronRight,
  Handshake,
  PhoneCall,
  MailPlus,
  CalendarPlus,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getAccounts,
  createAccount,
  deleteAccount,
  getDealStages,
  getDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getCrmStats,
} from "./actions"

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════
type CrmTab = "dashboard" | "contacts" | "pipeline" | "accounts" | "activities"

interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  mobile?: string
  job_title?: string
  department?: string
  account_id?: string
  lead_source?: string
  lead_score?: number
  status?: string
  tags?: string[]
  notes?: string
  created_at: string
  crm_accounts?: { id: string; name: string } | null
}

interface Account {
  id: string
  name: string
  domain?: string
  industry?: string
  company_size?: string
  phone?: string
  email?: string
  website?: string
  city?: string
  country?: string
  type?: string
  priority?: string
  annual_revenue?: number
  description?: string
  created_at: string
}

interface DealStage {
  id: string
  name: string
  color: string
  position: number
  probability: number
  is_won: boolean
  is_lost: boolean
}

interface Deal {
  id: string
  title: string
  value?: number
  currency?: string
  stage_id?: string
  priority?: string
  expected_close_date?: string
  description?: string
  created_at: string
  crm_deal_stages?: DealStage | null
  crm_contacts?: { id: string; first_name: string; last_name: string } | null
  crm_accounts?: { id: string; name: string } | null
}

interface ActivityItem {
  id: string
  type: string
  title: string
  description?: string
  contact_id?: string
  deal_id?: string
  account_id?: string
  due_date?: string
  is_completed: boolean
  completed_at?: string
  duration_minutes?: number
  outcome?: string
  created_at: string
  crm_contacts?: { id: string; first_name: string; last_name: string } | null
  crm_deals?: { id: string; title: string } | null
  crm_accounts?: { id: string; name: string } | null
}

interface CrmStats {
  totalContacts: number
  totalAccounts: number
  totalDeals: number
  pendingActivities: number
  totalPipeline: number
  totalWon: number
  winRate: number
  stages: DealStage[]
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function formatCurrency(amount: number, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const leadSourceLabels: Record<string, string> = {
  website: "Site web",
  referral: "Recommandation",
  linkedin: "LinkedIn",
  cold_call: "Appel froid",
  event: "Événement",
  advertising: "Publicité",
  other: "Autre",
}

const activityTypeIcons: Record<string, React.ReactNode> = {
  call: <PhoneCall className="h-4 w-4" />,
  email: <MailPlus className="h-4 w-4" />,
  meeting: <CalendarPlus className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckCircle2 className="h-4 w-4" />,
}

const activityTypeLabels: Record<string, string> = {
  call: "Appel",
  email: "Email",
  meeting: "Réunion",
  note: "Note",
  task: "Tâche",
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
}

// ══════════════════════════════════════════════════════════════
// MAIN CRM PAGE
// ══════════════════════════════════════════════════════════════
export default function CrmPage() {
  const [activeTab, setActiveTab] = useState<CrmTab>("dashboard")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [stages, setStages] = useState<DealStage[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [stats, setStats] = useState<CrmStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const refreshData = useCallback(async () => {
    setLoading(true)
    try {
      const [contactsRes, accountsRes, dealsRes, stagesRes, activitiesRes, statsRes] = await Promise.all([
        getContacts(),
        getAccounts(),
        getDeals(),
        getDealStages(),
        getActivities(),
        getCrmStats(),
      ])
      if (contactsRes.data) setContacts(contactsRes.data)
      if (accountsRes.data) setAccounts(accountsRes.data)
      if (dealsRes.data) setDeals(dealsRes.data)
      if (stagesRes.data) setStages(stagesRes.data)
      if (activitiesRes.data) setActivities(activitiesRes.data)
      if (!('error' in statsRes)) setStats(statsRes)
    } catch {
      toast.error("Erreur lors du chargement des données CRM")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const tabs: { id: CrmTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "dashboard", label: "Vue d'ensemble", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "contacts", label: "Contacts", icon: <Users className="h-4 w-4" />, count: stats?.totalContacts },
    { id: "pipeline", label: "Pipeline", icon: <TrendingUp className="h-4 w-4" />, count: stats?.totalDeals },
    { id: "accounts", label: "Comptes", icon: <Building2 className="h-4 w-4" />, count: stats?.totalAccounts },
    { id: "activities", label: "Activités", icon: <Activity className="h-4 w-4" />, count: stats?.pendingActivities },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
            <p className="text-sm text-muted-foreground">Gérez vos contacts, comptes et pipeline de ventes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-card/50"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  activeTab === tab.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && <CrmDashboard stats={stats} deals={deals} activities={activities} />}
            {activeTab === "contacts" && (
              <ContactsView
                contacts={contacts}
                accounts={accounts}
                searchQuery={searchQuery}
                onRefresh={refreshData}
              />
            )}
            {activeTab === "pipeline" && (
              <PipelineView
                deals={deals}
                stages={stages}
                contacts={contacts}
                accounts={accounts}
                onRefresh={refreshData}
              />
            )}
            {activeTab === "accounts" && (
              <AccountsView
                accounts={accounts}
                searchQuery={searchQuery}
                onRefresh={refreshData}
              />
            )}
            {activeTab === "activities" && (
              <ActivitiesView
                activities={activities}
                contacts={contacts}
                deals={deals}
                accounts={accounts}
                onRefresh={refreshData}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD VIEW
// ══════════════════════════════════════════════════════════════
function CrmDashboard({
  stats,
  deals,
  activities,
}: {
  stats: CrmStats | null
  deals: Deal[]
  activities: ActivityItem[]
}) {
  if (!stats) return null

  const recentDeals = deals.slice(0, 5)
  const pendingActivities = activities.filter((a) => !a.is_completed).slice(0, 5)

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Contacts"
            value={stats.totalContacts.toString()}
            color="text-blue-400"
          />
          <StatCard
            icon={<Building2 className="h-5 w-5" />}
            label="Comptes"
            value={stats.totalAccounts.toString()}
            color="text-purple-400"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Pipeline actif"
            value={formatCurrency(stats.totalPipeline)}
            color="text-amber-400"
          />
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Taux de conversion"
            value={`${stats.winRate}%`}
            sub={`${formatCurrency(stats.totalWon)} gagnés`}
            color="text-emerald-400"
          />
        </div>

        {/* Pipeline by Stage */}
        {stats.stages.length > 0 && (
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Pipeline par étape</h3>
            <div className="space-y-3">
              {stats.stages
                .filter((s) => !s.is_won && !s.is_lost)
                .map((stage) => {
                  const stageDeals = deals.filter((d) => d.stage_id === stage.id)
                  const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)
                  return (
                    <div key={stage.id} className="flex items-center gap-4">
                      <div className="w-32 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="text-sm font-medium truncate">{stage.name}</span>
                      </div>
                      <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all duration-500 flex items-center px-3"
                          style={{
                            backgroundColor: `${stage.color}30`,
                            width: `${Math.max(stageDeals.length > 0 ? 15 : 0, (stageValue / (stats.totalPipeline || 1)) * 100)}%`,
                          }}
                        >
                          {stageDeals.length > 0 && (
                            <span className="text-xs font-medium whitespace-nowrap" style={{ color: stage.color }}>
                              {stageDeals.length} deal{stageDeals.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold w-36 text-right">{formatCurrency(stageValue)}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deals */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Deals récents</h3>
            {recentDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun deal pour le moment</p>
            ) : (
              <div className="space-y-3">
                {recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: deal.crm_deal_stages?.color || "#6366f1" }} />
                      <div>
                        <p className="text-sm font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.crm_contacts ? `${deal.crm_contacts.first_name} ${deal.crm_contacts.last_name}` : "Sans contact"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(deal.value || 0)}</p>
                      <p className="text-xs text-muted-foreground">{deal.crm_deal_stages?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Activities */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Activités en attente</h3>
            {pendingActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune activité en attente</p>
            ) : (
              <div className="space-y-3">
                {pendingActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {activityTypeIcons[activity.type] || <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activityTypeLabels[activity.type]}
                        {activity.crm_contacts && ` · ${activity.crm_contacts.first_name} ${activity.crm_contacts.last_name}`}
                      </p>
                    </div>
                    {activity.due_date && (
                      <span className="text-xs text-muted-foreground">{formatDate(activity.due_date)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center", color)}>{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// CONTACTS VIEW
// ══════════════════════════════════════════════════════════════
function ContactsView({
  contacts,
  accounts,
  searchQuery,
  onRefresh,
}: {
  contacts: Contact[]
  accounts: Account[]
  searchQuery: string
  onRefresh: () => Promise<void>
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    account_id: "",
    lead_source: "",
    status: "active",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  const filtered = contacts.filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.job_title?.toLowerCase().includes(q) ||
      c.crm_accounts?.name?.toLowerCase().includes(q)
    )
  })

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name) {
      toast.error("Le prénom et le nom sont requis")
      return
    }
    setSaving(true)
    const res = await createContact({
      ...form,
      account_id: form.account_id || undefined,
      lead_source: form.lead_source || undefined,
    })
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Contact créé avec succès")
      setShowAdd(false)
      setForm({ first_name: "", last_name: "", email: "", phone: "", job_title: "", account_id: "", lead_source: "", status: "active", notes: "" })
      await onRefresh()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteContact(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Contact supprimé")
      await onRefresh()
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{filtered.length} contact{filtered.length !== 1 ? "s" : ""}</h2>
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Nouveau contact
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entreprise</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Poste</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Aucun contact</p>
                    <p className="text-sm">Créez votre premier contact pour démarrer</p>
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => (
                  <tr key={contact.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </div>
                        <span className="font-medium text-sm">{contact.first_name} {contact.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{contact.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{contact.phone || "—"}</td>
                    <td className="px-4 py-3 text-sm">{contact.crm_accounts?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{contact.job_title || "—"}</td>
                    <td className="px-4 py-3">
                      {contact.lead_source && (
                        <Badge variant="outline" className="text-xs">{leadSourceLabels[contact.lead_source] || contact.lead_source}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={contact.status === "active" ? "default" : "secondary"} className="text-xs">
                        {contact.status === "active" ? "Actif" : contact.status === "inactive" ? "Inactif" : contact.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(contact.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Contact Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau contact</DialogTitle>
              <DialogDescription>Ajoutez un nouveau contact à votre CRM</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prénom *</label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Jean" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom *</label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Dupont" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jean@email.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 XX XX XX XX" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Poste</label>
                <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Directeur Commercial" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Entreprise</label>
                <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>
                <Select value={form.lead_source} onValueChange={(v) => setForm({ ...form, lead_source: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(leadSourceLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? "Création..." : "Créer le contact"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}

// ══════════════════════════════════════════════════════════════
// PIPELINE VIEW (Kanban)
// ══════════════════════════════════════════════════════════════
function PipelineView({
  deals,
  stages,
  contacts,
  accounts,
  onRefresh,
}: {
  deals: Deal[]
  stages: DealStage[]
  contacts: Contact[]
  accounts: Account[]
  onRefresh: () => Promise<void>
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [addStageId, setAddStageId] = useState("")
  const [form, setForm] = useState({
    title: "",
    value: "",
    contact_id: "",
    account_id: "",
    priority: "medium",
    expected_close_date: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!form.title) {
      toast.error("Le titre est requis")
      return
    }
    setSaving(true)
    const res = await createDeal({
      title: form.title,
      value: form.value ? parseFloat(form.value) : undefined,
      stage_id: addStageId || stages[0]?.id,
      contact_id: form.contact_id || undefined,
      account_id: form.account_id || undefined,
      priority: form.priority,
      expected_close_date: form.expected_close_date || undefined,
      description: form.description || undefined,
    })
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Deal créé avec succès")
      setShowAdd(false)
      setForm({ title: "", value: "", contact_id: "", account_id: "", priority: "medium", expected_close_date: "", description: "" })
      await onRefresh()
    }
  }

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    const res = await updateDeal(dealId, { stage_id: newStageId })
    if (res.error) toast.error(res.error)
    else await onRefresh()
  }

  const handleDeleteDeal = async (id: string) => {
    const res = await deleteDeal(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Deal supprimé")
      await onRefresh()
    }
  }

  const activeStages = stages.filter((s) => !s.is_lost)

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} ·{" "}
            {formatCurrency(deals.filter((d) => !d.crm_deal_stages?.is_won && !d.crm_deal_stages?.is_lost).reduce((s, d) => s + (d.value || 0), 0))} en pipeline
          </span>
        </div>
        <Button onClick={() => { setAddStageId(stages[0]?.id || ""); setShowAdd(true) }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau deal
        </Button>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="flex-1">
        <div className="flex gap-4 p-6 pt-2 h-full min-w-max">
          {activeStages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage_id === stage.id)
            const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)

            return (
              <div key={stage.id} className="w-72 flex flex-col rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
                {/* Stage Header */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="font-semibold text-sm">{stage.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setAddStageId(stage.id); setShowAdd(true) }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatCurrency(stageValue)}</p>
                </div>

                {/* Deals */}
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3 rounded-xl border border-border/50 bg-card/60 hover:bg-card/80 transition-all group cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium line-clamp-2 flex-1">{deal.title}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {stages
                                .filter((s) => s.id !== stage.id)
                                .map((s) => (
                                  <DropdownMenuItem key={s.id} onClick={() => handleMoveDeal(deal.id, s.id)}>
                                    <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: s.color }} />
                                    Déplacer → {s.name}
                                  </DropdownMenuItem>
                                ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteDeal(deal.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <p className="text-lg font-bold mb-2">{formatCurrency(deal.value || 0)}</p>

                        <div className="space-y-1">
                          {deal.crm_contacts && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {deal.crm_contacts.first_name} {deal.crm_contacts.last_name}
                            </div>
                          )}
                          {deal.crm_accounts && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {deal.crm_accounts.name}
                            </div>
                          )}
                          {deal.expected_close_date && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(deal.expected_close_date)}
                            </div>
                          )}
                        </div>

                        {deal.priority && deal.priority !== "medium" && (
                          <div className="mt-2">
                            <Badge variant="outline" className={cn("text-[10px]", priorityColors[deal.priority])}>
                              {deal.priority === "high" ? "Haute" : deal.priority === "urgent" ? "Urgente" : "Basse"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}

                    {stageDeals.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        <Handshake className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Aucun deal</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Add Deal Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau deal</DialogTitle>
            <DialogDescription>Créez une nouvelle opportunité dans votre pipeline</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Titre *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contrat logiciel XYZ" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valeur (XOF)</label>
              <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="1500000" type="number" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Étape</label>
              <Select value={addStageId} onValueChange={setAddStageId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.filter(s => !s.is_lost).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact</label>
              <Select value={form.contact_id} onValueChange={(v) => setForm({ ...form, contact_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Compte</label>
              <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de clôture prévue</label>
              <Input value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} type="date" />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notes sur cette opportunité..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Création..." : "Créer le deal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ACCOUNTS VIEW
// ══════════════════════════════════════════════════════════════
function AccountsView({
  accounts,
  searchQuery,
  onRefresh,
}: {
  accounts: Account[]
  searchQuery: string
  onRefresh: () => Promise<void>
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: "",
    industry: "",
    company_size: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    country: "",
    type: "prospect",
    priority: "medium",
    description: "",
  })
  const [saving, setSaving] = useState(false)

  const filtered = accounts.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.industry?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
    )
  })

  const handleCreate = async () => {
    if (!form.name) {
      toast.error("Le nom de l'entreprise est requis")
      return
    }
    setSaving(true)
    const res = await createAccount({
      ...form,
      company_size: form.company_size || undefined,
      industry: form.industry || undefined,
    })
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Compte créé avec succès")
      setShowAdd(false)
      setForm({ name: "", industry: "", company_size: "", email: "", phone: "", website: "", city: "", country: "", type: "prospect", priority: "medium", description: "" })
      await onRefresh()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteAccount(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Compte supprimé")
      await onRefresh()
    }
  }

  const typeLabels: Record<string, { label: string; color: string }> = {
    prospect: { label: "Prospect", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    client: { label: "Client", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    partner: { label: "Partenaire", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    vendor: { label: "Fournisseur", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    other: { label: "Autre", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{filtered.length} compte{filtered.length !== 1 ? "s" : ""}</h2>
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
            <Building2 className="h-4 w-4" /> Nouveau compte
          </Button>
        </div>

        {/* Cards Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="font-medium text-muted-foreground">Aucun compte</p>
            <p className="text-sm text-muted-foreground">Créez votre premier compte entreprise</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((account) => (
              <div key={account.id} className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-5 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {account.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{account.name}</p>
                      {account.industry && (
                        <p className="text-xs text-muted-foreground">{account.industry}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(account.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-3">
                  {account.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {account.email}
                    </div>
                  )}
                  {account.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {account.phone}
                    </div>
                  )}
                  {(account.city || account.country) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {[account.city, account.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {account.website && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" /> {account.website}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", typeLabels[account.type || "prospect"]?.color)}>
                    {typeLabels[account.type || "prospect"]?.label}
                  </Badge>
                  {account.company_size && (
                    <Badge variant="outline" className="text-[10px]">{account.company_size} emp.</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Account Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau compte</DialogTitle>
              <DialogDescription>Ajoutez une entreprise à votre CRM</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Nom de l'entreprise *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secteur</label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Technologie" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Taille</label>
                <Select value={form.company_size} onValueChange={(v) => setForm({ ...form, company_size: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10</SelectItem>
                    <SelectItem value="11-50">11-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                    <SelectItem value="201-500">201-500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@acme.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 XX XX XX XX" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Site web</label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="acme.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ville</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Abidjan" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pays</label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Côte d'Ivoire" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="partner">Partenaire</SelectItem>
                    <SelectItem value="vendor">Fournisseur</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? "Création..." : "Créer le compte"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}

// ══════════════════════════════════════════════════════════════
// ACTIVITIES VIEW
// ══════════════════════════════════════════════════════════════
function ActivitiesView({
  activities,
  contacts,
  deals,
  accounts,
  onRefresh,
}: {
  activities: ActivityItem[]
  contacts: Contact[]
  deals: Deal[]
  accounts: Account[]
  onRefresh: () => Promise<void>
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [form, setForm] = useState({
    type: "call",
    title: "",
    description: "",
    contact_id: "",
    deal_id: "",
    due_date: "",
    duration_minutes: "",
  })
  const [saving, setSaving] = useState(false)

  const filtered = activities.filter((a) => {
    if (filter === "all") return true
    if (filter === "pending") return !a.is_completed
    if (filter === "completed") return a.is_completed
    return a.type === filter
  })

  const handleCreate = async () => {
    if (!form.title) {
      toast.error("Le titre est requis")
      return
    }
    setSaving(true)
    const res = await createActivity({
      type: form.type,
      title: form.title,
      description: form.description || undefined,
      contact_id: form.contact_id || undefined,
      deal_id: form.deal_id || undefined,
      due_date: form.due_date || undefined,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : undefined,
    })
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Activité créée")
      setShowAdd(false)
      setForm({ type: "call", title: "", description: "", contact_id: "", deal_id: "", due_date: "", duration_minutes: "" })
      await onRefresh()
    }
  }

  const handleToggleComplete = async (id: string, currentState: boolean) => {
    const res = await updateActivity(id, {
      is_completed: !currentState,
      completed_at: !currentState ? new Date().toISOString() : null,
    })
    if (res.error) toast.error(res.error)
    else await onRefresh()
  }

  const handleDeleteActivity = async (id: string) => {
    const res = await deleteActivity(id)
    if (res.error) toast.error(res.error)
    else {
      toast.success("Activité supprimée")
      await onRefresh()
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{filtered.length} activité{filtered.length !== 1 ? "s" : ""}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="call">Appels</SelectItem>
                <SelectItem value="email">Emails</SelectItem>
                <SelectItem value="meeting">Réunions</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
                <SelectItem value="task">Tâches</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nouvelle activité
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="font-medium text-muted-foreground">Aucune activité</p>
            <p className="text-sm text-muted-foreground">Enregistrez vos appels, emails et réunions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all group",
                  activity.is_completed && "opacity-60"
                )}
              >
                <button
                  onClick={() => handleToggleComplete(activity.id, activity.is_completed)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                    activity.is_completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/30 hover:border-primary"
                  )}
                >
                  {activity.is_completed && <CheckCircle2 className="h-4 w-4" />}
                </button>

                <div className="h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center text-primary shrink-0">
                  {activityTypeIcons[activity.type] || <Activity className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", activity.is_completed && "line-through")}>{activity.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5">{activityTypeLabels[activity.type]}</Badge>
                    {activity.crm_contacts && (
                      <span>{activity.crm_contacts.first_name} {activity.crm_contacts.last_name}</span>
                    )}
                    {activity.crm_deals && (
                      <span>· {activity.crm_deals.title}</span>
                    )}
                    {activity.duration_minutes && (
                      <span>· {activity.duration_minutes} min</span>
                    )}
                  </div>
                </div>

                {activity.due_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(activity.due_date)}
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDeleteActivity(activity.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}

        {/* Add Activity Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle activité</DialogTitle>
              <DialogDescription>Enregistrez un appel, email, réunion ou note</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  {(["call", "email", "meeting", "note", "task"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, type })}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                        form.type === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                      )}
                    >
                      {activityTypeIcons[type]}
                      {activityTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Titre *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Appel de suivi avec..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact</label>
                <Select value={form.contact_id} onValueChange={(v) => setForm({ ...form, contact_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deal</label>
                <Select value={form.deal_id} onValueChange={(v) => setForm({ ...form, deal_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} type="datetime-local" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Durée (min)</label>
                <Input value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} type="number" placeholder="30" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notes sur cette activité..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? "Création..." : "Créer l'activité"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}
