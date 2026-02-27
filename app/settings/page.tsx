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
import { integrations as initialIntegrations } from "@/lib/store"
import { toast } from "sonner"
import { useThemeVariant, type ThemeVariant } from "@/components/theme/variant-provider"

// --- MOCK DATA ---
const currentUser = {
  name: "Menann Zoro",
  email: "menannzoro@gmail.com",
  role: "Propriétaire de l'organisation",
  avatar: "MZ"
}

const organization = {
  name: "L'organisation de Menann Zoro",
  role: "Propriétaire de l'organisation",
  plan: "Gratuit",
  membersCount: 1,
}

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

function SettingsContent() {
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get("section") as SettingsSection | null
  const [activeSection, setActiveSection] = useState<SettingsSection>(sectionParam || "members")

  useEffect(() => {
    if (sectionParam) {
      setActiveSection(sectionParam)
    }
  }, [sectionParam])

  const menuItems = [
    { 
      title: "Compte personnel", 
      items: [
        { id: "account", icon: User, label: "Mon profil", sub: currentUser.email },
        { id: "notifications", icon: Bell, label: "Notifications" },
        { id: "theme", icon: Palette, label: "Apparence" },
        { id: "security", icon: Shield, label: "Sécurité" },
      ]
    },
    { 
      title: "Organisation", 
      items: [
        { id: "organization", icon: Building, label: organization.name, sub: `${organization.role}` },
        { id: "members", icon: Users, label: "Membres & Groupes" },
        { id: "integrations", icon: Database, label: "Intégrations" },
        { id: "billing", icon: CreditCard, label: "Abonnement" },
        { id: "permissions", icon: Lock, label: "Permissions" },
      ]
    },
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
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-semibold mb-2">Abonnement & Facturation</h2>
            <p className="text-muted-foreground max-w-md">
              La gestion de l'abonnement n'est pas disponible dans cette version de démonstration.
            </p>
          </div>
        )
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
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-muted text-foreground transition-colors">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Aide & Support</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-destructive/10 text-destructive transition-colors">
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Mon Profil</h2>
        <p className="text-muted-foreground">Gérez vos informations personnelles et préférences.</p>
      </div>
      <Separator />
      
      <div className="grid gap-6 max-w-2xl">
        <div className="flex items-center gap-6">
          <UserAvatar name={currentUser.name} fallback={currentUser.avatar} className="h-20 w-20 text-xl" />
          <div className="space-y-2">
            <Button variant="outline" size="sm">Changer l'avatar</Button>
            <p className="text-xs text-muted-foreground">JPG, GIF ou PNG. Max 1MB.</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nom complet</label>
            <Input defaultValue={currentUser.name} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input defaultValue={currentUser.email} disabled />
            <p className="text-xs text-muted-foreground">Contactez l'administrateur pour changer votre email.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Rôle (Titre)</label>
            <Input defaultValue="Product Designer" placeholder="Votre poste" />
          </div>
        </div>

        <Button className="w-fit">Enregistrer les modifications</Button>
      </div>
    </div>
  )
}

function NotificationSettings() {
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
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Mentions & Assignations</label>
              <p className="text-xs text-muted-foreground">Quand quelqu'un vous mentionne ou vous assigne une tâche.</p>
            </div>
            <Switch defaultChecked />
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
            <Switch />
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
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
        </div>
      </div>
    </div>
  )
}

function SecuritySettings() {
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
               <label className="text-sm font-medium">Mot de passe actuel</label>
               <Input type="password" />
             </div>
             <div className="grid gap-2">
               <label className="text-sm font-medium">Nouveau mot de passe</label>
               <Input type="password" />
             </div>
             <Button variant="outline" className="w-fit">Mettre à jour</Button>
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
             <Button variant="outline">Activer</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState(initialIntegrations)
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleToggle = (id: string, name: string, status: string) => {
    if (status === 'connected') {
      // Deconnecter
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: 'disconnected' } : i))
      toast.info(`${name} déconnecté.`)
    } else {
      // Connecter (simule un délai)
      setConnecting(id)
      setTimeout(() => {
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: 'connected' } : i))
        setConnecting(null)
        toast.success(`${name} connecté avec succès !`)
      }, 1500)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Intégrations</h2>
        <p className="text-muted-foreground">Connectez vos outils externes pour synchroniser vos données.</p>
      </div>
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map(integration => (
          <Card key={integration.id} className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center border border-border/40">
                  {integration.name === 'Slack' && <Slack className="h-6 w-6 text-[#4A154B]" />}
                  {integration.name === 'Jira' && <Github className="h-6 w-6 text-primary" />}
                  {integration.name === 'Microsoft Teams' && <Mail className="h-6 w-6 text-blue-500" />}
                  {integration.name === 'Asana' && <Chrome className="h-6 w-6 text-rose-500" />}
                </div>
                <Badge 
                  tone={integration.status === 'connected' ? "good" : "neutral"}
                  className="border-none"
                >
                  {integration.status === 'connected' ? 'Connecté' : 'Déconnecté'}
                </Badge>
              </div>
              <h3 className="font-bold text-lg">{integration.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">{integration.description}</p>
              <Button 
                variant={integration.status === 'connected' ? "outline" : "default"} 
                className="w-full gap-2 rounded-xl transition-all"
                onClick={() => handleToggle(integration.id, integration.name, integration.status)}
                disabled={connecting === integration.id}
              >
                {connecting === integration.id ? (
                  <>
                    <Activity className="h-3 w-3 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    {integration.status === 'connected' ? 'Gérer' : 'Connecter'}
                    <ExternalLink className="h-3 w-3" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function OrganizationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Paramètres de l'Organisation</h2>
        <p className="text-muted-foreground">Gérez les informations générales de votre espace de travail.</p>
      </div>
      <Separator />
      
      <div className="grid gap-6 max-w-2xl">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Nom de l'organisation</label>
          <Input defaultValue={organization.name} />
        </div>
        
        <div className="grid gap-2">
           <label className="text-sm font-medium">URL de l'espace de travail</label>
           <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">zoropilot.com/</span>
              <Input defaultValue="menann-zoro-org" className="flex-1" />
           </div>
        </div>

        <div className="pt-4">
           <h3 className="text-sm font-medium text-destructive mb-2">Zone de danger</h3>
           <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-destructive">Supprimer l'organisation</p>
                 <p className="text-xs text-destructive/80">Cette action est irréversible et supprimera toutes les données.</p>
              </div>
              <Button variant="destructive" size="sm">Supprimer</Button>
           </div>
        </div>
      </div>
    </div>
  )
}

function MembersSettings() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Membre")
  const [groupName, setGroupName] = useState("")

  const availableRoles = (userRole: string) => {
    if (userRole === "Propriétaire de l'organisation") {
      return ["Administrateur", "Membre", "Invité"]
    }
    if (userRole === "Administrateur") {
      return ["Membre", "Invité"]
    }
    return []
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    toast.success(`Invitation envoyée à ${inviteEmail} en tant que ${inviteRole}`)
    setIsInviteOpen(false)
    setInviteEmail("")
  }

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName) return
    toast.success(`Groupe "${groupName}" créé avec succès`)
    setIsCreateGroupOpen(false)
    setGroupName("")
  }

  const roles = availableRoles(currentUser.role)

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Membres & Groupes</h2>
            <p className="text-muted-foreground">Gérez les accès et l&apos;organisation de votre équipe.</p>
          </div>
          <div className="flex gap-2">
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
                    Envoyez une invitation par email pour rejoindre votre organisation.
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
                    <Button type="submit">Envoyer l'invitation</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
       </div>
       <Separator />

       <Tabs defaultValue="members" className="flex-1 flex flex-col">
          <TabsList className="mb-4">
             <TabsTrigger value="members">Membres</TabsTrigger>
             <TabsTrigger value="groups">Groupes</TabsTrigger>
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
                   {[1, 2, 3].map((i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "px-4 py-3 border-b last:border-0 grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center hover:bg-muted/5 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
                          i === 1 ? "[animation-delay:var(--delay-1)]" : i === 2 ? "[animation-delay:var(--delay-2)]" : "[animation-delay:var(--delay-3)]"
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <UserAvatar 
                              name={i === 1 ? currentUser.name : `User ${i}`} 
                              fallback={i === 1 ? currentUser.avatar : `U${i}`}
                              className="h-8 w-8" 
                            />
                            <div>
                               <div className="text-sm font-medium">{i === 1 ? currentUser.name : `Membre ${i}`}</div>
                               <div className="text-xs text-muted-foreground">{i === 1 ? currentUser.email : `user${i}@example.com`}</div>
                            </div>
                         </div>
                         <div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                               i === 1 ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                            }`}>
                               {i === 1 ? "Propriétaire" : "Membre"}
                            </span>
                         </div>
                         <div className="text-sm text-muted-foreground">Il y a 2h</div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                               </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                               <DropdownMenuLabel>Options membre</DropdownMenuLabel>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem className="cursor-pointer">
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Modifier le rôle
                               </DropdownMenuItem>
                               <DropdownMenuItem className="cursor-pointer">
                                  <ShieldAlert className="h-4 w-4 mr-2" />
                                  Gérer les permissions
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                                  <UserX className="h-4 w-4 mr-2" />
                                  Retirer de l&apos;organisation
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                   ))}
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
                   <div>Membres</div>
                   <div className="w-8"></div>
                </div>
                <div className="overflow-auto flex-1">
                   {[
                      { name: "Direction", members: 1 },
                      { name: "Ingénierie", members: 5 },
                      { name: "Design", members: 3 },
                   ].map((group, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "px-4 py-3 border-b last:border-0 grid grid-cols-[2fr_1fr_auto] gap-4 items-center hover:bg-muted/5 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
                          i === 0 ? "[animation-delay:var(--delay-2)]" : i === 1 ? "[animation-delay:var(--delay-4)]" : "[animation-delay:var(--delay-6)]"
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                               <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-sm font-medium">{group.name}</div>
                         </div>
                         <div className="text-sm text-muted-foreground">{group.members} membres</div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                               </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                               <DropdownMenuLabel>Options groupe</DropdownMenuLabel>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem className="cursor-pointer">
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Modifier le groupe
                               </DropdownMenuItem>
                               <DropdownMenuItem className="cursor-pointer">
                                  <Users className="h-4 w-4 mr-2" />
                                  Gérer les membres
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archiver le groupe
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                   ))}
                </div>
             </div>
          </TabsContent>
       </Tabs>
    </div>
  )
}

function PermissionsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Permissions</h2>
        <p className="text-muted-foreground">
          Vue de synthèse des rôles et des droits sur l&apos;organisation (démo).
        </p>
      </div>
      <Separator />
      <div className="text-sm text-muted-foreground">
        La logique métier RBAC détaillée est gérée côté back-end et reflétée dans l&apos;application via les
        hooks de permissions.
      </div>
    </div>
  )
}
