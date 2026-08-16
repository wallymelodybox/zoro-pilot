"use client"

import { useEffect, useState, Suspense } from "react"
import { useTheme } from "next-themes"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/user-avatar"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  User,
  Building,
  Users,
  CreditCard,
  Folder,
  Archive,
  Zap,
  Lock,
  ShieldCheck,
  Activity,
  HelpCircle,
  LogOut,
  ChevronRight,
  Search,
  Mail,
  Moon,
  Sun,
  Laptop,
  KeyRound,
  Shield,
  Palette,
  MoreHorizontal,
  Database,
  Chrome,
  Github,
  Slack,
  ExternalLink,
  ShieldAlert,
  UserX,
  Edit2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useThemeVariant, type ThemeVariant } from "@/components/theme/variant-provider"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { AvatarUpload } from "@/components/avatar-upload"

type SettingsSection =
  | "account"
  | "notifications"
  | "organization"
  | "members"
  | "billing"
  | "theme"
  | "security"
  | "integrations"
  | "permissions"

const canManageOrgSettings = (role?: string | null) =>
  role === "super_admin" || role === "admin" || role === "executive"

const canManageOrgMembers = (role?: string | null) =>
  role === "super_admin" || role === "admin" || role === "executive"

function NotConfigured({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-5 text-sm">
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  )
}

function SettingsContent() {
  const { user, loading: userLoading } = useUser()
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get("section") as SettingsSection | null
  const isDGOrAdmin = canManageOrgSettings(user?.rbac_role)
  
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    isDGOrAdmin ? (sectionParam || "members") : "account"
  )

  useEffect(() => {
    if (sectionParam) {
      if (isDGOrAdmin || ["account", "notifications", "theme", "security"].includes(sectionParam)) {
        setActiveSection(sectionParam)
      } else {
        setActiveSection("account")
      }
    }
  }, [sectionParam, isDGOrAdmin])

  if (userLoading) {
    return <div className="p-10 text-center">Chargement...</div>
  }

  const menuItems = [
    { 
      title: "Compte personnel", 
      items: [
        { id: "account", icon: User, label: "Mon profil", sub: user?.email },
        { id: "notifications", icon: Bell, label: "Notifications" },
        { id: "theme", icon: Palette, label: "Apparence" },
        { id: "security", icon: Shield, label: "Sécurité" },
      ]
    },
    ...(isDGOrAdmin ? [{ 
      title: "Organisation", 
      items: [
        { id: "organization", icon: Building, label: user?.organization_name || "Organisation", sub: user?.role },
        { id: "members", icon: Users, label: "Membres & Groupes" },
        { id: "integrations", icon: Database, label: "Intégrations" },
        { id: "billing", icon: CreditCard, label: "Abonnement" },
        { id: "permissions", icon: Lock, label: "Permissions" },
      ]
    }] : []),
  ]

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings />
      case "notifications":
        return <NotificationSettings />
      case "organization":
        return <OrganizationSettings />
      case "members":
        return <MembersSettings />
      case "theme":
        return <ThemeSettings />
      case "security":
        return <SecuritySettings />
      case "integrations":
        return <IntegrationsSettings />
      case "permissions":
        return <PermissionsSettings />
      case "billing":
        return <BillingSettings />
      default:
        return <MembersSettings />
    }
  }

  return (
    <div className="flex h-full bg-transparent">
      {/* Settings Navigation (Secondary) */}
      <div className="w-72 bg-card/40 backdrop-blur-md border-r h-full hidden md:flex md:flex-col">
        <div className="p-6 border-b border-border/50">
            <h1 className="font-bold text-xl tracking-tight">Paramètres</h1>
            <p className="text-xs text-muted-foreground mt-1">Gérez votre espace ZORO</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {menuItems.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-[10px] font-bold text-muted-foreground px-3 uppercase tracking-[0.2em]">{section.title}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={() => setActiveSection(item.id as SettingsSection)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                        activeSection === item.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:bg-muted text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${activeSection === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{item.label}</div>
                      </div>
                      {activeSection === item.id && <ChevronRight className="h-3 w-3 text-primary-foreground/70" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-border/50 space-y-1">
          <button
            type="button"
            onClick={() => window.open("mailto:support@zoro-pilot.company?subject=Aide%20Zoro%20Pilot", "_blank")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-muted text-foreground transition-colors"
          >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Aide & Support</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              const { createClient } = await import("@/lib/supabase/client")
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = "/login"
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-destructive/10 text-destructive transition-colors"
          >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
        <div className="max-w-4xl w-full mx-auto p-6 lg:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
           {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SettingsContent />
    </Suspense>
  )
}

// --- Sub-Components for Settings Sections ---

function AccountSettings() {
  const { user, refresh } = useUser()
  const [name, setName] = useState(user?.name || "")
  const [role, setRole] = useState(user?.role || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name,
          role: role,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success("Profil mis à jour !")
      refresh() // Refresh user context
    } catch (error) {
      toast.error("Erreur lors de la mise à jour.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Mon Profil</h2>
        <p className="text-muted-foreground">Gérez vos informations personnelles et préférences.</p>
      </div>
      <Separator />
      
      <div className="grid gap-6 max-w-2xl">
        <div className="flex items-center gap-6">
          <AvatarUpload 
            uid={user?.id || null}
            url={avatarUrl}
            size={80}
            onUpload={(url) => setAvatarUrl(url)}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nom complet</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input defaultValue={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">Contactez l'administrateur pour changer votre email.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Rôle (Titre)</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Votre poste" />
          </div>
        </div>

        <Button className="w-fit" onClick={handleSave} disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  )
}

function NotificationSettings() {
  const { user } = useUser()
  const supabase = createClient()
  const [dailySummary, setDailySummary] = useState(true)
  const [assignments, setAssignments] = useState(true)
  const [push, setPush] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return
      setLoading(true)
      const { data, error } = await supabase
        .from("user_settings")
        .select("notification_daily_summary, notification_assignments, notification_push")
        .eq("profile_id", user.id)
        .maybeSingle()

      if (!error && data) {
        setDailySummary(data.notification_daily_summary)
        setAssignments(data.notification_assignments)
        setPush(data.notification_push)
      }
      setLoading(false)
    }

    loadSettings()
  }, [user?.id])

  const saveSettings = async (updates: {
    notification_daily_summary?: boolean
    notification_assignments?: boolean
    notification_push?: boolean
  }) => {
    if (!user?.id) return
    setSaving(true)
    const { error } = await supabase
      .from("user_settings")
      .upsert({
        profile_id: user.id,
        notification_daily_summary: updates.notification_daily_summary ?? dailySummary,
        notification_assignments: updates.notification_assignments ?? assignments,
        notification_push: updates.notification_push ?? push,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      toast.error("Impossible d'enregistrer les préférences.")
    } else {
      toast.success("Préférences enregistrées.")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">Choisissez comment vous souhaitez être informé.</p>
      </div>
      <Separator />
      
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Résumé quotidien</label>
              <p className="text-xs text-muted-foreground">Recevez un résumé de vos tâches chaque matin.</p>
            </div>
            <Switch
              checked={dailySummary}
              disabled={loading || saving}
              onCheckedChange={(checked) => {
                setDailySummary(checked)
                saveSettings({ notification_daily_summary: checked })
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Mentions & Assignations</label>
              <p className="text-xs text-muted-foreground">Quand quelqu'un vous mentionne ou vous assigne une tâche.</p>
            </div>
            <Switch
              checked={assignments}
              disabled={loading || saving}
              onCheckedChange={(checked) => {
                setAssignments(checked)
                saveSettings({ notification_assignments: checked })
              }}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Push (Navigateur)</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Activer les notifications push</label>
              <p className="text-xs text-muted-foreground">Recevez des alertes en temps réel sur votre bureau.</p>
            </div>
            <Switch
              checked={push}
              disabled={loading || saving}
              onCheckedChange={(checked) => {
                setPush(checked)
                saveSettings({ notification_push: checked })
              }}
            />
          </div>
          <NotConfigured
            title="Canal push non configuré"
            description="La préférence est conservée en base, mais l'envoi navigateur nécessite encore le service de notifications."
          />
        </div>
      </div>
    </div>
  )
}

function ThemeSettings() {
  const { variant, setVariant } = useThemeVariant()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Apparence</h2>
        <p className="text-muted-foreground">Personnalisez l'apparence de l'interface.</p>
      </div>
      <Separator />
      
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Style du tableau de bord</h3>
        <p className="text-xs text-muted-foreground">
          Choisissez une ambiance visuelle pour toute l&apos;application.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 max-w-5xl">
          <button
            type="button"
            onClick={() => setVariant("command-center")}
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
              variant === "command-center"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Option 1
            </span>
            <span className="text-sm font-medium">Command Center</span>
            <span className="text-[11px] text-muted-foreground">
              Mode sombre profond, accents néon et cartes glassmorphism.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVariant("ai-productivity")}
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
              variant === "ai-productivity"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Option 2
            </span>
            <span className="text-sm font-medium">AI Productivity</span>
            <span className="text-[11px] text-muted-foreground">
              UI claire ultra soft, cartes très arrondies et interface épurée.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVariant("executive-futurist")}
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
              variant === "executive-futurist"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Option 3
            </span>
            <span className="text-sm font-medium">Executive Futurist</span>
            <span className="text-[11px] text-muted-foreground">
              Design premium élégant avec focalisation sur les indicateurs stratégiques.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVariant("pmo-clarity")}
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
              variant === "pmo-clarity"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Option 4
            </span>
            <span className="text-sm font-medium">PMO Clarity</span>
            <span className="text-[11px] text-muted-foreground">
              Interface claire, compacte et orientée exécution projet.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setVariant("strategic-notebook")}
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
              variant === "strategic-notebook"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Carnet
            </span>
            <span className="text-sm font-medium">Strategic Notebook</span>
            <span className="text-[11px] text-muted-foreground">
              Cahier de pilotage vivant, cartes sticky notes et ambiance pastel.
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

function SecuritySettings() {
  const supabase = createClient()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const handlePasswordUpdate = async () => {
    if (password.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas.")
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error("Impossible de mettre à jour le mot de passe.")
    } else {
      toast.success("Mot de passe mis à jour.")
      setPassword("")
      setConfirmPassword("")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sécurité</h2>
        <p className="text-muted-foreground">Protégez votre compte et vos données.</p>
      </div>
      <Separator />
      
      <div className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Mot de passe</h3>
          <div className="grid gap-4">
             <div className="grid gap-2">
               <label className="text-sm font-medium">Nouveau mot de passe</label>
               <Input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 autoComplete="new-password"
               />
             </div>
             <div className="grid gap-2">
               <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
               <Input
                 type="password"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 autoComplete="new-password"
               />
             </div>
             <Button
               variant="outline"
               className="w-fit"
               onClick={handlePasswordUpdate}
               disabled={saving || !password || !confirmPassword}
             >
               {saving ? "Mise à jour..." : "Mettre à jour"}
             </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Authentification à deux facteurs (2FA)</h3>
          <div className="flex items-center justify-between border p-4 rounded-lg">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                   <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                   <p className="text-sm font-medium">Application d'authentification</p>
                   <p className="text-xs text-muted-foreground">Sécurisez votre compte avec Google Auth ou Authy.</p>
                </div>
             </div>
             <Button variant="outline" disabled>Non configuré</Button>
          </div>
          <NotConfigured
            title="2FA non activée côté projet"
            description="Le bouton d'activation reste désactivé tant que la configuration 2FA Supabase n'est pas branchée."
          />
        </div>
      </div>
    </div>
  )
}

function IntegrationsSettings() {
  const integrations = [
    { id: "slack", name: "Slack", description: "Notifications d'équipe et alertes projet.", icon: Slack },
    { id: "jira", name: "Jira", description: "Synchronisation tickets et suivi d'exécution.", icon: Github },
    { id: "teams", name: "Microsoft Teams", description: "Notifications et canaux de collaboration.", icon: Mail },
    { id: "asana", name: "Asana", description: "Import et synchronisation de tâches.", icon: Chrome },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Intégrations</h2>
        <p className="text-muted-foreground">Connectez vos outils externes pour synchroniser vos données.</p>
      </div>
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map(integration => {
          const Icon = integration.icon
          return (
          <Card key={integration.id} className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center border border-border/40">
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <Badge tone="neutral" className="border-none">
                  Non configuré
                </Badge>
              </div>
              <h3 className="font-bold text-lg">{integration.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">{integration.description}</p>
              <Button variant="outline" className="w-full gap-2 rounded-xl" disabled>
                Connecteur indisponible
              </Button>
            </CardContent>
          </Card>
        )})}
      </div>
      <NotConfigured
        title="Aucune intégration externe active"
        description="Les cartes ci-dessus ne lancent plus de fausse connexion. Il faudra brancher OAuth/webhooks avant de les activer."
      />
    </div>
  )
}

function OrganizationSettings() {
  const { user, refresh } = useUser()
  const [name, setName] = useState(user?.organization_name || "")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const canEdit = canManageOrgSettings(user?.rbac_role)

  useEffect(() => {
    setName(user?.organization_name || "")
  }, [user?.organization_name])

  const handleSave = async () => {
    if (!user?.organization_id || !canEdit) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name })
        .eq('id', user.organization_id)

      if (error) throw error
      toast.success("Organisation mise à jour !")
      refresh()
    } catch (error) {
      toast.error("Erreur lors de la mise à jour.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Paramètres de l'Organisation</h2>
          <p className="text-muted-foreground">Gérez les informations générales de votre espace de travail.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !name || !canEdit}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
      <Separator />
      
      <div className="grid gap-6 max-w-2xl">
        {!canEdit && (
          <NotConfigured
            title="Modification réservée au DG"
            description="Seuls les profils DG, administrateur ou super administrateur peuvent modifier les paramètres de l'organisation."
          />
        )}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Nom de l'organisation</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
        </div>
        
        <div className="grid gap-2">
           <label className="text-sm font-medium">URL de l'espace de travail</label>
           <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">zoro-pilot.company/</span>
              <Input value={user?.organization_name?.toLowerCase().replace(/\s+/g, '-') || ""} className="flex-1" disabled />
           </div>
        </div>

        <div className="pt-4">
           <h3 className="text-sm font-medium text-destructive mb-2">Zone de danger</h3>
           <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-destructive">Supprimer l'organisation</p>
                 <p className="text-xs text-destructive/80">Cette action est irréversible et supprimera toutes les données.</p>
              </div>
              <Button variant="destructive" size="sm" disabled title="Suppression disponible uniquement via le BO super admin">
                Désactivé
              </Button>
           </div>
           <p className="mt-2 text-xs text-muted-foreground">
             La suppression d'une organisation passe par le back-office super admin afin d'éviter une perte accidentelle en production.
           </p>
        </div>
      </div>
    </div>
  )
}

function BillingSettings() {
  const { user } = useUser()
  const supabase = createClient()
  const [billing, setBilling] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBilling() {
      if (!user?.organization_id) return
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('license_type, expires_at, created_at')
        .eq('id', user.organization_id)
        .single()

      if (!error) setBilling(data)
      setLoading(false)
    }

    loadBilling()
  }, [user?.organization_id])

  const expiresAt = billing?.expires_at
    ? new Date(billing.expires_at).toLocaleDateString('fr-FR')
    : "Non défini"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Abonnement & Facturation</h2>
        <p className="text-muted-foreground">Consultez l'état de licence de votre organisation.</p>
      </div>
      <Separator />

      {loading ? (
        <div className="text-sm text-muted-foreground">Chargement de l'abonnement...</div>
      ) : (
        <div className="grid gap-4 max-w-2xl">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Licence actuelle</p>
                <p className="mt-1 text-lg font-semibold capitalize">{billing?.license_type || "mensuelle"}</p>
              </div>
              <Badge tone={billing?.license_type === "definitive" ? "good" : "neutral"}>
                {billing?.license_type === "definitive" ? "Définitive" : "Active"}
              </Badge>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Expiration</p>
            <p className="mt-1 text-lg font-semibold">{billing?.license_type === "definitive" ? "Aucune expiration" : expiresAt}</p>
          </div>
          <NotConfigured
            title="Paiement non connecté"
            description="La lecture de licence est branchée en base. Le paiement et les factures doivent rester gérés depuis le back-office tant qu'aucun prestataire de paiement n'est connecté."
          />
        </div>
      )}
    </div>
  )
}

function MembersSettings() {
  const { user } = useUser()
  const supabase = createClient()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Membre")
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [invitesLoading, setInvitesLoading] = useState(true)

  useEffect(() => {
    if (user?.organization_id) {
      fetchMembers()
      fetchGroups()
      fetchInvites()
    }
  }, [user?.organization_id])

  async function fetchInvites() {
    setInvitesLoading(true)
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('organization_id', user?.organization_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setInvites(data || [])
    } catch (error) {
      console.error("Error fetching invites:", error)
      setInvites([])
    } finally {
      setInvitesLoading(false)
    }
  }

  async function fetchMembers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', user?.organization_id)
        .order('name', { ascending: true })
      
      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchGroups() {
    setGroupsLoading(true)
    try {
      const { data, error } = await supabase
        .from('organization_groups')
        .select('*')
        .eq('organization_id', user?.organization_id)
        .order('name', { ascending: true })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error("Error fetching groups:", error)
      setGroups([])
    } finally {
      setGroupsLoading(false)
    }
  }

  // Le rôle "Administrateur" (rbac_role: 'admin') a les mêmes permissions qu'un DG
  // (voir hasPermission dans lib/rbac.ts). Les comptes DG/Admin ne doivent être créés
  // que depuis le back-office (bo-zoro-control-2026-secure), jamais par invitation.
  const availableRoles = (userRole: string) => {
    if (userRole === "super_admin" || userRole === "admin" || userRole === "executive") {
      return ["Chef de département", "Membre", "Invité"]
    }
    return []
  }

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    try {
      const inviteCode = generateInviteCode()
      const { data: invite, error } = await supabase
        .from('invites')
        .insert({
          token: Math.random().toString(36).substring(2, 15),
          invite_code: inviteCode,
          organization_id: user?.organization_id,
          invited_email: inviteEmail,
          rbac_role_assigned: inviteRole === "Chef de département" ? "manager" : "member",
          role_assigned: inviteRole,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
          created_by: user?.id
        })
        .select()
        .single()

      if (error || !invite) {
        console.error('Invite insert error:', error)
        const msg = error?.message || 'Erreur lors de la génération de l\'invitation.'
        toast.error(`${msg} Si l'erreur persiste, vérifiez les permissions RLS.`)
        return
      }

      toast.success(`Invitation générée pour ${inviteEmail} - Code: ${inviteCode}`)

      try {
        await navigator.clipboard.writeText(inviteCode)
        toast.info('Code d\'invitation copié dans le presse-papier !')
      } catch (clipErr) {
        console.warn('Clipboard write failed:', clipErr)
      }

      setIsInviteOpen(false)
      setInviteEmail('')
      fetchInvites()
    } catch (err) {
      console.error('Unexpected error generating invite:', err)
      toast.error('Erreur inattendue lors de la génération de l\'invitation.')
    }
  }

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName) return
    ;(async () => {
      const { error } = await supabase
        .from('organization_groups')
        .insert({
          organization_id: user?.organization_id,
          name: groupName.trim(),
          created_by: user?.id,
        })

      if (error) {
        toast.error("Impossible de créer ce groupe.")
        return
      }

      toast.success(`Groupe "${groupName}" créé`)
      setIsCreateGroupOpen(false)
      setGroupName("")
      fetchGroups()
    })()
  }

  const roles = availableRoles(user?.rbac_role || user?.role || "")

  const canManageGroups = !!user?.organization_id && canManageOrgMembers(user?.rbac_role)
  const canInviteMembers = !!user?.organization_id && canManageOrgSettings(user?.rbac_role)
  const canManageMembers = !!user?.organization_id && canManageOrgMembers(user?.rbac_role)
  const [editingMember, setEditingMember] = useState<any | null>(null)
  const [editingRole, setEditingRole] = useState<string>("")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)

  const roleLabelToRbac = (label: string) =>
    label === "Administrateur" ? "admin" : label === "Chef de département" ? "manager" : label === "Invité" ? "viewer" : "member"

  const handleUpdateMemberRole = async () => {
    if (!editingMember) return

    // Prevent users from changing their own role unless they are super_admin (app owner)
    if (editingMember.id === user?.id && user?.rbac_role !== 'super_admin') {
      toast.error("Vous ne pouvez pas modifier votre propre rôle. Contactez le propriétaire de l'application.")
      return
    }

    // Never allow non-super_admin to modify the app owner
    if ((editingMember.rbac_role as string) === 'super_admin' && user?.rbac_role !== 'super_admin') {
      toast.error("Impossible de modifier le propriétaire de l'application.")
      return
    }

    const newRbac = roleLabelToRbac(editingRole)

    const { error } = await supabase
      .from("profiles")
      .update({ rbac_role: newRbac, role: editingRole })
      .eq("id", editingMember.id)

    if (error) {
      toast.error("Impossible de mettre à jour le rôle.")
    } else {
      toast.success("Rôle mis à jour.")
      setIsEditOpen(false)
      setEditingMember(null)
      fetchMembers()
    }
  }

  const handleRemoveMember = async () => {
    if (!editingMember) return

    // Prevent users from removing themselves unless they are super_admin (app owner)
    if (editingMember.id === user?.id && user?.rbac_role !== 'super_admin') {
      toast.error("Vous ne pouvez pas vous retirer de l'organisation. Contactez le propriétaire de l'application.")
      return
    }

    // Prevent removing the app owner by non-owner users
    if (editingMember.rbac_role === 'super_admin' && user?.rbac_role !== 'super_admin') {
      toast.error("Impossible de retirer le propriétaire de l'application.")
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({ organization_id: null, rbac_role: "viewer", role: "Invité" })
      .eq("id", editingMember.id)

    if (error) {
      toast.error("Impossible de retirer le membre.")
    } else {
      toast.success("Membre retiré de l'organisation.")
      setIsRemoveOpen(false)
      setEditingMember(null)
      fetchMembers()
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Membres & Groupes</h2>
            <p className="text-muted-foreground">Gérez les accès et l&apos;organisation de votre équipe.</p>
          </div>
          {(canManageGroups || canInviteMembers) && (
            <div className="flex gap-2">
              {canManageGroups && (
              <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                     <Users className="h-4 w-4 mr-2" />
                     Créer un groupe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau groupe</DialogTitle>
                    <DialogDescription>
                      Regroupez vos membres pour faciliter la gestion des permissions et des partages.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateGroup} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom du groupe</label>
                      <Input 
                        placeholder="ex: Design, Marketing, Direction..." 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsCreateGroupOpen(false)}>Annuler</Button>
                      <Button type="submit">Créer le groupe</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              )}

              {canInviteMembers && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button disabled={roles.length === 0}>
                     <Mail className="h-4 w-4 mr-2" />
                     Inviter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Inviter un nouveau membre</DialogTitle>
                    <DialogDescription>
                      Générez un lien d'invitation à partager avec le membre.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Adresse email</label>
                      <Input 
                        type="email" 
                        placeholder="nom@entreprise.com" 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rôle attribué</label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        Les permissions associées dépendent du rôle choisi.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>Annuler</Button>
                      <Button type="submit">Générer le lien</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              )}
            </div>
          )}
       </div>
       <Separator />

       <Tabs defaultValue="members" className="flex-1 flex flex-col">
          <TabsList className="mb-4">
             <TabsTrigger value="members">Membres</TabsTrigger>
             <TabsTrigger value="groups">Groupes</TabsTrigger>
             <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="flex-1 flex flex-col space-y-4 outline-none">
             {/* Search & Filter */}
             <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input className="pl-9" placeholder="Rechercher un membre..." />
                </div>
             </div>

             {/* Members List */}
             <div className="border rounded-lg flex-1 overflow-hidden flex flex-col">
                <div className="bg-muted/50 px-4 py-3 border-b grid grid-cols-[2fr_1fr_1fr_auto] gap-4 text-xs font-medium text-muted-foreground">
                   <div>Nom</div>
                   <div>Rôle</div>
                   <div>Dernière activité</div>
                   <div className="w-8"></div>
                </div>
                <div className="overflow-auto flex-1">
                   {loading ? (
                     <div className="p-10 text-center text-muted-foreground">Chargement des membres...</div>
                   ) : members.length === 0 ? (
                     <div className="p-10 text-center text-muted-foreground">Aucun membre trouvé.</div>
                   ) : (
                     members.map((m, i) => (
                        <div 
                          key={m.id} 
                          className={cn(
                            "px-4 py-3 border-b last:border-0 grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center hover:bg-muted/5 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
                            `[animation-delay:${i * 50}ms]`
                          )}
                        >
                          <div className="flex items-center gap-3">
                             <UserAvatar
                               name={m.name}
                               avatarUrl={m.avatar_url}
                               fallback={m.name?.[0] || "U"}
                               className="h-8 w-8"
                             />
                             <div>
                                <div className="text-sm font-medium">{m.name}</div>
                                <div className="text-xs text-muted-foreground">{m.email}</div>
                             </div>
                          </div>
                          <div>
                             <span className={cn(
                               "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                               m.rbac_role === 'admin' || m.rbac_role === 'executive' || m.rbac_role === 'super_admin'
                                 ? "bg-purple-100 text-purple-700"
                                 : "bg-blue-100 text-blue-700"
                             )}>
                                {m.role || m.rbac_role}
                             </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(m.created_at).toLocaleDateString('fr-FR')}
                          </div>
                            <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                   <MoreHorizontal className="h-4 w-4" />
                                </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Options membre</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                 onSelect={() => {
                                  if (!canManageMembers) return
                                  setEditingMember(m)
                                  setEditingRole(m.role || m.rbac_role || "Membre")
                                  setIsEditOpen(true)
                                 }}
                                 disabled={!canManageMembers}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Modifier le rôle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                 onSelect={() => {
                                  if (!canManageMembers) return
                                  setEditingMember(m)
                                  setIsRemoveOpen(true)
                                 }}
                                 disabled={!canManageMembers}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Retirer du workspace
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled className="text-destructive focus:text-destructive">
                                  <ShieldAlert className="h-4 w-4 mr-2" />
                                  Gérer les permissions avancées bientôt
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                     ))
                   )}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="groups" className="flex-1 flex flex-col space-y-4 outline-none">
             {/* Search & Filter */}
             <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input className="pl-9" placeholder="Rechercher un groupe..." />
                </div>
             </div>

             {/* Groups List */}
             <div className="border rounded-lg flex-1 overflow-hidden flex flex-col">
                <div className="bg-muted/50 px-4 py-3 border-b grid grid-cols-[2fr_1fr_auto] gap-4 text-xs font-medium text-muted-foreground">
                   <div>Nom du groupe</div>
                   <div>Créé le</div>
                   <div className="w-8"></div>
                </div>
                <div className="overflow-auto flex-1">
                   {groupsLoading ? (
                     <div className="p-10 text-center text-muted-foreground">Chargement des groupes...</div>
                   ) : groups.length === 0 ? (
                     <div className="p-10 text-center text-muted-foreground">Aucun groupe créé.</div>
                   ) : (
                    groups.map((group, i) => (
                      <div 
                        key={group.id} 
                        className={cn(
                          "px-4 py-3 border-b last:border-0 grid grid-cols-[2fr_1fr_auto] gap-4 items-center hover:bg-muted/5 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
                          `[animation-delay:${i * 50}ms]`
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                               <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-sm font-medium">{group.name}</div>
                         </div>
                         <div className="text-sm text-muted-foreground">
                           {new Date(group.created_at).toLocaleDateString('fr-FR')}
                         </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                               </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                               <DropdownMenuLabel>Options groupe</DropdownMenuLabel>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem disabled>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Modifier bientôt
                               </DropdownMenuItem>
                               <DropdownMenuItem disabled>
                                  <Users className="h-4 w-4 mr-2" />
                                  Gérer les membres bientôt
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem disabled className="text-destructive focus:text-destructive">
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archiver bientôt
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                   )))}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="invitations" className="flex-1 flex flex-col space-y-4 outline-none">
             {/* Invitations List */}
             <div className="border rounded-lg flex-1 overflow-hidden flex flex-col">
                <div className="bg-muted/50 px-4 py-3 border-b grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 text-xs font-medium text-muted-foreground">
                   <div>Email</div>
                   <div>Code</div>
                   <div>Rôle</div>
                   <div>Statut</div>
                   <div className="w-8"></div>
                </div>
                <div className="overflow-auto flex-1">
                   {invitesLoading ? (
                     <div className="p-10 text-center text-muted-foreground">Chargement des invitations...</div>
                   ) : invites.length === 0 ? (
                     <div className="p-10 text-center text-muted-foreground">Aucune invitation générée.</div>
                   ) : (
                     invites.map((inv, i) => (
                        <div 
                          key={inv.id} 
                          className={cn(
                            "px-4 py-3 border-b last:border-0 grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center hover:bg-muted/5 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
                            `[animation-delay:${i * 50}ms]`
                          )}
                        >
                          <div className="text-sm font-medium">{inv.invited_email}</div>
                          <div>
                            <Badge className="font-mono">{inv.invite_code || "N/A"}</Badge>
                          </div>
                          <div>
                             <span className={cn(
                               "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                               inv.rbac_role_assigned === 'admin' || inv.rbac_role_assigned === 'executive'
                                 ? "bg-purple-100 text-purple-700"
                                 : "bg-blue-100 text-blue-700"
                             )}>
                                {inv.role_assigned}
                             </span>
                          </div>
                          <div>
                            {inv.is_used ? (
                              <Badge tone="good">Utilisée</Badge>
                            ) : new Date(inv.expires_at) < new Date() ? (
                              <Badge tone="bad">Expirée</Badge>
                            ) : (
                              <Badge tone="neutral">Active</Badge>
                            )}
                          </div>
                          {!inv.is_used && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                if (inv.invite_code) {
                                  try {
                                    await navigator.clipboard.writeText(inv.invite_code)
                                    toast.success('Code copié dans le presse-papier !')
                                  } catch {
                                    toast.error('Impossible de copier le code')
                                  }
                                }
                              }}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                       </div>
                     ))
                   )}
                </div>
             </div>
          </TabsContent>
       </Tabs>
      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>Choisissez un nouveau rôle pour le membre.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rôle</label>
              <Select value={editingRole} onValueChange={(v) => setEditingRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {(availableRoles(user?.rbac_role || user?.role || "") || []).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setIsEditOpen(false); setEditingMember(null) }}>Annuler</Button>
              <Button onClick={handleUpdateMemberRole}>Enregistrer</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le membre</DialogTitle>
            <DialogDescription>Confirmez le retrait du membre de l'organisation. Cette action peut être annulée en ré-invitant le membre.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-muted-foreground mb-4">{editingMember ? `${editingMember.name} (${editingMember.email})` : ""}</div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setIsRemoveOpen(false); setEditingMember(null) }}>Annuler</Button>
              <Button variant="destructive" onClick={handleRemoveMember}>Retirer</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PermissionsSettings() {
  const rows = [
    { role: "DG / Admin", projects: "Créer et gérer", tasks: "Créer, assigner, visibilité org", members: "Inviter et gérer", settings: "Modifier" },
    { role: "Chef de département", projects: "Lecture organisation", tasks: "Créer ses tâches privées", members: "Inviter selon politique", settings: "Lecture" },
    { role: "Membre", projects: "Lecture organisation", tasks: "Créer ses tâches privées", members: "Lecture", settings: "Lecture" },
    { role: "Invité", projects: "Lecture limitée", tasks: "Selon assignation", members: "Lecture limitée", settings: "Lecture" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Permissions</h2>
        <p className="text-muted-foreground">
          Synthèse des droits appliqués par les rôles et les policies Supabase.
        </p>
      </div>
      <Separator />
      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[1.2fr_1fr_1.3fr_1fr_1fr] gap-3 bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div>Rôle</div>
          <div>Projets</div>
          <div>Tâches</div>
          <div>Membres</div>
          <div>Paramètres</div>
        </div>
        {rows.map((row) => (
          <div key={row.role} className="grid grid-cols-[1.2fr_1fr_1.3fr_1fr_1fr] gap-3 border-t px-4 py-3 text-sm">
            <div className="font-medium">{row.role}</div>
            <div className="text-muted-foreground">{row.projects}</div>
            <div className="text-muted-foreground">{row.tasks}</div>
            <div className="text-muted-foreground">{row.members}</div>
            <div className="text-muted-foreground">{row.settings}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
