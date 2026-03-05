"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Shield, UserPlus, Key, Building, Activity, LayoutDashboard, Clock, AlertCircle, LogOut, Server, Users, Database, Globe, Zap } from "lucide-react"
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
      } else if (!user) {
        // Redirect to login if not logged in
        redirect("/login")
      }
      // If user is logged in but not authorized, stay on page and show "Not Authorized" view
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

  async function handleSignOut() {
    await supabase.auth.signOut()
    redirect("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">Vérification des accès...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-destructive/20 bg-destructive/5 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">Accès Restreint</CardTitle>
            <CardDescription className="text-base mt-2">
              Votre compte ({user?.email}) n'a pas les privilèges requis pour accéder au Back Office.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 p-4 rounded-xl flex items-start gap-3 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive/80 leading-relaxed">
                Seuls les comptes avec le rôle <strong>super_admin</strong> peuvent accéder à cette zone de contrôle.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="w-full h-11 rounded-xl border-border/40 hover:bg-background/80"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter pour changer de compte
            </Button>
            <Button 
              onClick={() => redirect("/")}
              variant="ghost" 
              className="w-full h-11 rounded-xl text-muted-foreground hover:text-foreground"
            >
              Retourner au dashboard client
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            CONTROL PANEL
          </h1>
          <p className="text-muted-foreground text-lg">Global Platform Administration & Infrastructure.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Server Region</span>
            <span className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-3 w-3 text-primary" />
              EU-WEST-3 (Paris)
            </span>
          </div>
          <div className="h-10 w-px bg-border/40" />
          <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 shadow-sm flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-bold text-primary uppercase tracking-widest">System Healthy</span>
          </div>
        </div>
      </div>

      {/* System Infrastructure Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/20 backdrop-blur-xl border-border/40 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Latency</p>
              <h3 className="text-xl font-bold">42ms</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/20 backdrop-blur-xl border-border/40 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Sessions</p>
              <h3 className="text-xl font-bold">1,284</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/20 backdrop-blur-xl border-border/40 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DB Load</p>
              <h3 className="text-xl font-bold">14%</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/20 backdrop-blur-xl border-border/40 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Uptime</p>
              <h3 className="text-xl font-bold">99.98%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl hover:shadow-primary/5 transition-all">
          <CardHeader>
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-[0.2em]">
              <Key className="h-4 w-4" />
              Licences Opérationnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{organizations.filter(o => o.setup_completed).length}</div>
            <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <div className="h-full bg-green-500" style={{ width: `${(organizations.filter(o => o.setup_completed).length / (organizations.length || 1)) * 100}%` }} />
            </div>
            <p className="text-[10px] text-green-500 mt-2 font-black uppercase tracking-widest">Health: optimal</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl hover:shadow-primary/5 transition-all">
          <CardHeader>
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-[0.2em]">
              <AlertCircle className="h-4 w-4" />
              Urgent Renewals
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
            <p className="text-[10px] text-muted-foreground mt-2 font-black uppercase tracking-widest">Action Required: LOW</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <UserPlus className="h-32 w-32" />
          </div>
          <div className="h-1.5 w-full bg-primary/20" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <UserPlus className="h-6 w-6 text-primary" />
              ONBOARDING CLIENT
            </CardTitle>
            <CardDescription className="text-base">
              Initialisation d'une nouvelle instance DG.
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
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Code Licence / Organization</label>
                <Input 
                  placeholder="ex: CODE-ENT-2026" 
                  className="h-12 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                  value={licenseCode} 
                  onChange={(e) => setLicenseCode(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-black text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={creating}>
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Initialisation...
                  </div>
                ) : "GÉNÉRER ACCÈS"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-black tracking-tight flex items-center justify-between">
              RECENT ACTIVITY
              <Button variant="ghost" size="sm" onClick={() => redirect("/bo-zoro-control-2026-secure/licenses")} className="text-xs font-black text-primary uppercase tracking-[0.2em] hover:bg-primary/10">
                View Log
              </Button>
            </CardTitle>
            <CardDescription className="text-base">Real-time platform deployment status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fetching ? (
                <div className="text-center py-10 text-muted-foreground animate-pulse font-bold tracking-widest">SCANNING INFRASTRUCTURE...</div>
              ) : organizations.slice(0, 4).map((org) => {
                const progress = getLicenseProgress(org)
                const timeLeft = getTimeLeft(org.expires_at)
                
                return (
                  <div key={org.id} className="space-y-3 p-4 rounded-2xl border border-border/20 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/10">
                          {org.name?.charAt(0) || "O"}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground truncate max-w-37.5">{org.name || "UNNAMED_ORG"}</div>
                          <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{org.license_type || 'STANDARD'} · {new Date(org.created_at).toLocaleDateString()}</div>
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
                        <span>Resource Allocation</span>
                        <span>{100 - progress}%</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-1.5 bg-background/50" 
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
                <div className="text-center py-10 text-muted-foreground italic font-medium">No activity records found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
