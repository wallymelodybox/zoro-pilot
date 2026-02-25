"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/user-avatar"
import { Switch } from "@/components/ui/switch"
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
  MoreHorizontal
} from "lucide-react"

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
  membersCount: 1
}

type SettingsSection = "account" | "notifications" | "organization" | "members" | "billing" | "theme" | "security"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("members")

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
    <div className="flex h-screen bg-muted/30">
      {/* Settings Sidebar */}
      <aside className="w-80 bg-background border-r flex flex-col h-full">
        <div className="p-4 border-b">
            <h1 className="font-semibold text-lg">Paramètres</h1>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {menuItems.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground px-2 uppercase tracking-wider">{section.title}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={() => setActiveSection(item.id as SettingsSection)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group ${
                        activeSection === item.id
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${activeSection === item.id ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        {item.sub && <div className="text-xs text-muted-foreground truncate">{item.sub}</div>}
                      </div>
                      {activeSection === item.id && <ChevronRight className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-muted text-foreground transition-colors">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Aide & Support</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-destructive/10 text-destructive transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-background/50 overflow-hidden">
        <div className="max-w-4xl w-full mx-auto p-8 flex flex-col h-full overflow-y-auto">
           {renderContent()}
        </div>
      </main>
    </div>
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
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Apparence</h2>
        <p className="text-muted-foreground">Personnalisez l'apparence de l'interface.</p>
      </div>
      <Separator />
      
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <div 
          onClick={() => setTheme("light")}
          className={`space-y-2 cursor-pointer group transition-all ${theme === "light" ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
        >
          <div className={`h-32 rounded-lg border-2 p-2 shadow-sm flex flex-col gap-2 bg-white ${theme === "light" ? "border-primary" : "border-transparent ring-1 ring-border"}`}>
            <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
            <div className="flex-1 bg-slate-50 rounded-md border border-dashed border-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-full border ${theme === "light" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
            <span className="text-sm font-medium">Clair</span>
          </div>
        </div>

        <div 
          onClick={() => setTheme("dark")}
          className={`space-y-2 cursor-pointer group transition-all ${theme === "dark" ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
        >
          <div className={`h-32 rounded-lg border-2 p-2 shadow-sm flex flex-col gap-2 bg-slate-950 ${theme === "dark" ? "border-primary" : "border-transparent ring-1 ring-border"}`}>
            <div className="h-4 w-3/4 bg-slate-800 rounded-md" />
            <div className="flex-1 bg-slate-900 rounded-md border border-dashed border-slate-800" />
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-full border ${theme === "dark" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
            <span className="text-sm font-medium">Sombre</span>
          </div>
        </div>

        <div 
          onClick={() => setTheme("system")}
          className={`space-y-2 cursor-pointer group transition-all ${theme === "system" ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
        >
          <div className={`h-32 rounded-lg border-2 p-2 shadow-sm flex flex-col gap-2 relative overflow-hidden bg-slate-100 ${theme === "system" ? "border-primary" : "border-transparent ring-1 ring-border"}`}>
            <div className="absolute inset-0 bg-linear-to-tr from-background to-slate-950/20" />
            <div className="h-4 w-3/4 bg-muted rounded-md relative z-10" />
            <div className="flex-1 bg-muted/20 rounded-md border border-dashed relative z-10" />
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-full border ${theme === "system" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
            <span className="text-sm font-medium">Système</span>
          </div>
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
  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Membres</h2>
            <p className="text-muted-foreground">Gérez les accès à votre organisation.</p>
          </div>
          <Button>
             <Mail className="h-4 w-4 mr-2" />
             Inviter
          </Button>
       </div>
       <Separator />

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
                <div key={i} className="px-4 py-3 border-b last:border-0 grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center hover:bg-muted/5 transition-colors">
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
                   <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                   </Button>
                </div>
             ))}
          </div>
       </div>
    </div>
  )
}
