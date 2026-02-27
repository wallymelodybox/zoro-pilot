"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, UserPlus, Key, Building, Activity, LayoutDashboard, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createDGAccount } from "./actions"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export default function BackOfficePage() {
  const { user, loading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [dgEmail, setDgEmail] = useState("")
  const [dgName, setDgName] = useState("")
  const [licenseCode, setLicenseCode] = useState("")
  const [creating, setCreating] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!loading) {
      if (user?.rbac_role === 'super_admin' || user?.email === 'menannzoro@gmail.com') {
        setIsAuthorized(true)
        fetchStats()
      } else {
        redirect("/")
      }
    }
  }, [user, loading])

  async function fetchStats() {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setFetching(false)
    }
  }

  const handleCreateDG = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    const formData = new FormData()
    formData.append('name', dgName)
    formData.append('email', dgEmail)
    formData.append('licenseCode', licenseCode)

    try {
      const res = await createDGAccount(formData)
      
      if (res.error) {
        toast.error(res.error)
      } else if (res.success) {
        toast.success(res.message)
        alert(`COMPTE CRÉÉ !\nDG: ${dgName}\nMot de passe temporaire: ${res.tempPassword}\n\nVeuillez le transmettre au DG en toute sécurité.`)
        
        setDgEmail("")
        setDgName("")
        setLicenseCode("")
        fetchStats()
      }
    } catch (error) {
      toast.error("Erreur système lors de la création du compte DG")
    } finally {
      setCreating(false)
    }
  }

  const getLicenseProgress = (org: any) => {
    if (org.license_type === 'definitive') return 100
    if (!org.expires_at || !org.created_at) return 0
    
    const total = new Date(org.expires_at).getTime() - new Date(org.created_at).getTime()
    const elapsed = new Date().getTime() - new Date(org.created_at).getTime()
    const progress = Math.max(0, Math.min(100, 100 - (elapsed / total * 100)))
    return isNaN(progress) ? 0 : Math.round(progress)
  }

  const getTimeLeft = (expiryDate: string | null) => {
    if (!expiryDate) return "Illimité"
    const diff = new Date(expiryDate).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) return "Expiré"
    if (days === 0) return "Aujourd'hui"
    if (days > 30) {
      const months = Math.floor(days / 30)
      return `${months} mois restant${months > 1 ? 's' : ''}`
    }
    return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
  }

  if (loading) return <div className="p-10 text-center">Chargement...</div>
  if (!isAuthorized) return null

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            Zoro Pilot Admin
          </h1>
          <p className="text-muted-foreground text-lg">Tableau de bord de gestion stratégique des licences.</p>
        </div>
        <div className="flex items-center gap-4 bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 shadow-sm">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-bold text-primary uppercase tracking-widest">Système Actif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl hover:shadow-primary/5 transition-all">
          <CardHeader>
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-[0.2em]">
              <Key className="h-4 w-4" />
              Licences Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{organizations.filter(o => o.setup_completed).length}</div>
            <p className="text-xs text-green-500 mt-2 font-medium">Clients opérationnels</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl hover:shadow-primary/5 transition-all">
          <CardHeader>
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-[0.2em]">
              <Building className="h-4 w-4" />
              Organisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{organizations.length}</div>
            <p className="text-xs text-blue-500 mt-2 font-medium">Entités enregistrées</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl hover:shadow-primary/5 transition-all">
          <CardHeader>
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-[0.2em]">
              <LayoutDashboard className="h-4 w-4" />
              Licences expirant bientôt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-amber-500">
              {organizations.filter(o => {
                if (o.license_type === 'definitive' || !o.expires_at) return false
                const days = Math.ceil((new Date(o.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return days > 0 && days <= 15
              }).length}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Dans les 15 prochains jours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-primary/20" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="h-6 w-6 text-primary" />
              Nouvel Accès DG
            </CardTitle>
            <CardDescription className="text-base">
              Générez un compte Super Utilisateur pour un nouveau client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDG} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Nom du DG</label>
                  <Input 
                    placeholder="Jean Dupont" 
                    className="h-12 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                    value={dgName} 
                    onChange={(e) => setDgName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Pro</label>
                  <Input 
                    type="email" 
                    placeholder="dg@entreprise.com" 
                    className="h-12 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                    value={dgEmail} 
                    onChange={(e) => setDgEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Identifiant Entreprise (Code)</label>
                <Input 
                  placeholder="ex: CODE-ENT-2026" 
                  className="h-12 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                  value={licenseCode} 
                  onChange={(e) => setLicenseCode(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={creating}>
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création en cours...
                  </div>
                ) : "Générer Accès Super Utilisateur"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center justify-between">
              Suivi des Licences
              <Button variant="ghost" size="sm" onClick={() => redirect("/bo-zoro-control-2026-secure/licenses")} className="text-xs font-bold text-primary uppercase tracking-widest hover:bg-primary/10">
                Voir tout
              </Button>
            </CardTitle>
            <CardDescription className="text-base">État des dernières licences émises.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fetching ? (
                <div className="text-center py-10 text-muted-foreground">Chargement des données...</div>
              ) : organizations.slice(0, 4).map((org) => {
                const progress = getLicenseProgress(org)
                const timeLeft = getTimeLeft(org.expires_at)
                
                return (
                  <div key={org.id} className="space-y-3 p-4 rounded-2xl border border-border/20 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/10">
                          {org.name?.charAt(0) || "O"}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground truncate max-w-37.5">{org.name || "En attente..."}</div>
                          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{org.license_type || 'mensuelle'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                          progress < 20 ? "text-destructive" : progress < 50 ? "text-amber-500" : "text-green-500"
                        )}>
                          <Clock className="h-3 w-3" />
                          {timeLeft}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        <span>Durée consommée</span>
                        <span>{100 - progress}%</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-2 bg-background/50" 
                        indicatorClassName={cn(
                          "transition-all",
                          progress < 20 ? "bg-destructive" : progress < 50 ? "bg-amber-500" : "bg-primary"
                        )}
                      />
                    </div>
                  </div>
                )
              })}
              {organizations.length === 0 && !fetching && (
                <div className="text-center py-10 text-muted-foreground italic">Aucune licence active.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
