"use client"

import * as React from "react"
import {
  Zap,
  Plus,
  Play,
  Settings2,
  MoreVertical,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  MousePointer2,
  Save,
  Trash2,
  ChevronRight,
  Layers,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// --- TYPES ---

type TriggerType = "task_completed" | "project_created" | "deadline_approaching" | "new_message"
type ActionType = "send_chat" | "update_status" | "assign_user" | "send_email"

interface Automation {
  id: string
  name: string
  description: string
  active: boolean
  trigger: {
    type: TriggerType
    config: any
  }
  action: {
    type: ActionType
    config: any
  }
  lastRun?: string
  runsCount: number
}

// --- MOCK DATA ---

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: "auto-1",
    name: "Notification de fin de tâche",
    description: "Envoie un message dans le chat 'Général' quand une tâche critique est terminée.",
    active: true,
    trigger: {
      type: "task_completed",
      config: { priority: "urgent" }
    },
    action: {
      type: "send_chat",
      config: { channelId: "gen", message: "🚀 Une tâche critique vient d'être terminée !" }
    },
    lastRun: "Il y a 2 heures",
    runsCount: 124
  },
  {
    id: "auto-2",
    name: "Rappel d'échéance",
    description: "Alerte le manager si un projet est à 24h de sa date de fin sans être à 100%.",
    active: true,
    trigger: {
      type: "deadline_approaching",
      config: { timeframe: "24h" }
    },
    action: {
      type: "send_email",
      config: { recipient: "manager@zoro-pilot.com", subject: "Attention : Échéance proche" }
    },
    lastRun: "Hier",
    runsCount: 45
  }
]

// --- COMPONENTS ---

export default function AutomationsPage() {
  const [automations, setAutomations] = React.useState<Automation[]>(MOCK_AUTOMATIONS)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [step, setStep] = React.useState<"trigger" | "action" | "review">("trigger")
  
  // New automation state
  const [newName, setNewName] = React.useState("")
  const [newTrigger, setNewTrigger] = React.useState<TriggerType | "">("")
  const [newAction, setNewAction] = React.useState<ActionType | "">("")
  const [config, setConfig] = React.useState<any>({})

  const handleCreate = () => {
    if (!newName || !newTrigger || !newAction) return
    
    const next: Automation = {
      id: `auto-${Date.now()}`,
      name: newName,
      description: `Automatisation ${newTrigger} -> ${newAction}`,
      active: true,
      trigger: { type: newTrigger as TriggerType, config: {} },
      action: { type: newAction as ActionType, config: config },
      runsCount: 0
    }
    
    setAutomations([next, ...automations])
    setIsCreateOpen(false)
    toast.success("Automatisation créée avec succès !")
    // Reset
    setNewName("")
    setNewTrigger("")
    setNewAction("")
    setConfig({})
    setStep("trigger")
  }

  const toggleStatus = (id: string) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, active: !a.active } : a
    ))
    toast.info("Statut mis à jour")
  }

  return (
    <div className="flex h-screen flex-col bg-transparent">
      {/* Header */}
      <header className="flex flex-col border-b bg-card/40 backdrop-blur-md">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-lg shadow-primary/10">
              <Zap className="h-6 w-6 fill-primary/20" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Automatisations</h1>
              <p className="text-sm text-muted-foreground">Boostez votre productivité avec des flux de travail intelligents</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un flux..." className="pl-10 h-10 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20" />
            </div>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="h-10 px-5 gap-2 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Créer un flux
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-8">
          
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Flux Actifs</p>
                    <p className="text-2xl font-bold">{automations.filter(a => a.active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Exécutions (24h)</p>
                    <p className="text-2xl font-bold">169</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                    <MousePointer2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Temps économisé</p>
                    <p className="text-2xl font-bold">~14h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automations List */}
          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8">
              {automations.map((auto) => (
                <Card 
                  key={auto.id} 
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border-border/40 bg-card/40 backdrop-blur-xl",
                    !auto.active && "opacity-60 grayscale-[0.5]"
                  )}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-all" />
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          {auto.name}
                          {!auto.active && <Badge variant="secondary" className="text-[10px] h-4">Inactif</Badge>}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">{auto.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => toggleStatus(auto.id)}
                        >
                          <Play className={cn("h-4 w-4", auto.active ? "fill-primary text-primary" : "text-muted-foreground")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      {/* Flow Visualization */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                        <div className="flex flex-1 items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-background shadow-sm border border-border/40 shrink-0">
                            {auto.trigger.type === "task_completed" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                            {auto.trigger.type === "deadline_approaching" && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                          </div>
                          <span className="text-xs font-semibold truncate uppercase tracking-wider text-muted-foreground">Déclencheur</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        <div className="flex flex-1 items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-background shadow-sm border border-border/40 shrink-0">
                            {auto.action.type === "send_chat" && <MessageSquare className="h-3.5 w-3.5 text-blue-500" />}
                            {auto.action.type === "send_email" && <AlertCircle className="h-3.5 w-3.5 text-purple-500" />}
                          </div>
                          <span className="text-xs font-semibold truncate uppercase tracking-wider text-muted-foreground">Action</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/20">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Dernière exéc.</span>
                            <span className="text-xs font-medium">{auto.lastRun || "Jamais"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Total</span>
                            <span className="text-xs font-medium">{auto.runsCount} runs</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5">
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-150 bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/20 via-primary to-primary/20" />
          
          <DialogHeader className="pt-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary fill-primary/20" />
              Nouveau flux d'automatisation
            </DialogTitle>
            <DialogDescription>
              Configurez un déclencheur et une action pour automatiser vos tâches répétitives.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-8">
            {/* Progress indicator */}
            <div className="flex items-center justify-between px-10 relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
              <div className={cn("relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2", 
                step === "trigger" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border")}>1</div>
              <div className={cn("relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2", 
                step === "action" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border")}>2</div>
              <div className={cn("relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2", 
                step === "review" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border")}>3</div>
            </div>

            {step === "trigger" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">1. Nom du flux</label>
                  <Input 
                    placeholder="ex: Rappel facturation auto..." 
                    className="h-12 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">2. Quand ceci arrive (Déclencheur)</label>
                  <Select onValueChange={(v) => setNewTrigger(v as TriggerType)}>
                    <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/40">
                      <SelectValue placeholder="Choisir un déclencheur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task_completed">Tâche terminée</SelectItem>
                      <SelectItem value="project_created">Nouveau projet créé</SelectItem>
                      <SelectItem value="deadline_approaching">Échéance proche</SelectItem>
                      <SelectItem value="new_message">Nouveau message reçu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === "action" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">3. Alors faire ceci (Action)</label>
                  <Select onValueChange={(v) => setNewAction(v as ActionType)}>
                    <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/40">
                      <SelectValue placeholder="Choisir une action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_chat">Envoyer un message chat</SelectItem>
                      <SelectItem value="update_status">Mettre à jour un statut</SelectItem>
                      <SelectItem value="assign_user">Assigner un collaborateur</SelectItem>
                      <SelectItem value="send_email">Envoyer un e-mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newAction === "send_chat" && (
                  <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/20 animate-in fade-in duration-500">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Canal de destination</label>
                      <Select onValueChange={(v) => setConfig({ ...config, channelId: v })}>
                        <SelectTrigger className="h-10 bg-background/50 border-border/40">
                          <SelectValue placeholder="Choisir un canal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gen">Général</SelectItem>
                          <SelectItem value="dev">Développement</SelectItem>
                          <SelectItem value="ann">Annonces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                      <Input 
                        placeholder="Votre message..." 
                        className="h-10 bg-background/50 border-border/40"
                        onChange={(e) => setConfig({ ...config, message: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {newAction === "send_email" && (
                  <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/20 animate-in fade-in duration-500">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Destinataire</label>
                      <Input 
                        placeholder="email@exemple.com" 
                        className="h-10 bg-background/50 border-border/40"
                        onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sujet</label>
                      <Input 
                        placeholder="Sujet de l'email..." 
                        className="h-10 bg-background/50 border-border/40"
                        onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-primary/80 leading-relaxed">
                    Les paramètres configurés ici seront appliqués à chaque exécution du flux.
                  </p>
                </div>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="p-6 rounded-2xl bg-muted/30 border border-border/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Nom :</span>
                      <span className="text-sm font-bold">{newName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Déclencheur :</span>
                      <Badge variant="outline" className="bg-background">{newTrigger}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Action :</span>
                      <Badge variant="outline" className="bg-background">{newAction}</Badge>
                    </div>
                    {Object.keys(config).length > 0 && (
                      <div className="pt-2 border-t border-border/20">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">Configuration :</span>
                        <div className="space-y-1">
                          {Object.entries(config).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[11px]">
                              <span className="capitalize text-muted-foreground">{k} :</span>
                              <span className="font-mono text-primary">{v as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                <p className="text-center text-xs text-muted-foreground">
                  En cliquant sur "Créer", le flux sera immédiatement activé.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            {step === "trigger" && (
              <Button onClick={() => setStep("action")} disabled={!newName || !newTrigger} className="w-full h-11 rounded-xl">
                Suivant : Action
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === "action" && (
              <>
                <Button variant="ghost" onClick={() => setStep("trigger")} className="h-11 rounded-xl">Retour</Button>
                <Button onClick={() => setStep("review")} disabled={!newAction} className="flex-1 h-11 rounded-xl">
                  Suivant : Revue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
            {step === "review" && (
              <>
                <Button variant="ghost" onClick={() => setStep("action")} className="h-11 rounded-xl">Retour</Button>
                <Button onClick={handleCreate} className="flex-1 h-11 rounded-xl shadow-lg shadow-primary/20">
                  <Save className="mr-2 h-4 w-4" />
                  Créer l'automatisation
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
