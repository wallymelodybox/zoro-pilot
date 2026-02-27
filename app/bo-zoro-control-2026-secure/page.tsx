"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, UserPlus, Key, Building, Activity, LayoutDashboard } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createDGAccount } from "./actions"

export default function BackOfficePage() {
  const { user, loading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [dgEmail, setDgEmail] = useState("")
  const [dgName, setDgName] = useState("")
  const [licenseCode, setLicenseCode] = useState("")
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!loading) {
      // For now, we'll check if the email is the owner's email or rbac_role is super_admin
      // In a real app, you'd use a dedicated role in Supabase
      if (user?.rbac_role === 'super_admin' || user?.email === 'menannzoro@gmail.com') {
        setIsAuthorized(true)
      } else {
        redirect("/")
      }
    }
  }, [user, loading])

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
        // Display temp password to owner
        alert(`COMPTE CRÉÉ !\nDG: ${dgName}\nMot de passe temporaire: ${res.tempPassword}\n\nVeuillez le transmettre au DG en toute sécurité.`)
        
        setDgEmail("")
        setDgName("")
        setLicenseCode("")
      }
    } catch (error) {
      toast.error("Erreur système lors de la création du compte DG")
    } finally {
      setCreating(false)
    }
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
            <div className="text-4xl font-black">12</div>
            <p className="text-xs text-green-500 mt-2 font-medium">+2 ce mois-ci</p>
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
            <div className="text-4xl font-black">8</div>
            <p className="text-xs text-blue-500 mt-2 font-medium">Données Isolées</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl hover:shadow-primary/5 transition-all">
          <CardHeader>
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-[0.2em]">
              <LayoutDashboard className="h-4 w-4" />
              Revenus MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">450k <span className="text-lg font-bold">FCFA</span></div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Croissance +15%</p>
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
                <p className="text-xs text-muted-foreground/80 italic mt-2 ml-1">
                  💡 Ce code garantit l'isolation totale des données de cette organisation.
                </p>
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
            <CardTitle className="text-2xl">Activités Récentes</CardTitle>
            <CardDescription className="text-base">Historique des 5 dernières licences.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Mme. Amrani", org: "TechFlow", date: "Il y a 2h", code: "TF-99", status: "actif" },
                { name: "M. Lefebvre", org: "InnovateCorp", date: "Hier", code: "IC-45", status: "actif" },
                { name: "Julie Dubois", org: "NextGen", date: "Il y a 3j", code: "NG-12", status: "actif" },
                { name: "M. Traoré", org: "Sahel-Strat", date: "Il y a 1 sem.", code: "SS-21", status: "en attente" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-border/20 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg border border-primary/10">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-base font-bold text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground font-medium">{item.org} • <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{item.code}</code></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{item.date}</div>
                    <div className={cn(
                      "text-[9px] uppercase font-bold px-2 py-0.5 rounded-full",
                      item.status === "actif" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}>
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
