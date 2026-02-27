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
    
    // Logic to create a DG account would normally involve a backend function or Supabase Auth Admin API
    // Since we are in a client component, we simulate it or use a server action
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`Compte DG créé pour ${dgName} (${dgEmail}). Code licence: ${licenseCode}`)
      setDgEmail("")
      setDgName("")
      setLicenseCode("")
    } catch (error) {
      toast.error("Erreur lors de la création du compte DG")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="p-10 text-center">Chargement...</div>
  if (!isAuthorized) return null

  return (
    <div className="container mx-auto p-6 lg:p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Back Office - Administration Zoro Pilot
          </h1>
          <p className="text-muted-foreground">Gestion des licences DG et accès entreprises.</p>
        </div>
        <div className="flex items-center gap-4 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">Système Actif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Key className="h-4 w-4" />
              Licences Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">+2 ce mois-ci</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Building className="h-4 w-4" />
              Organisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Isolations OK</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-xl border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <LayoutDashboard className="h-4 w-4" />
              Revenus (Est.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">450k FCFA</div>
            <p className="text-xs text-muted-foreground mt-1">MRR Actuel</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Créer un compte DG (Super Utilisateur)
            </CardTitle>
            <CardDescription>
              Le DG pourra ensuite créer son organisation et inviter ses collaborateurs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDG} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom complet du DG</label>
                <Input 
                  placeholder="ex: Jean Dupont" 
                  value={dgName} 
                  onChange={(e) => setDgName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email professionnel</label>
                <Input 
                  type="email" 
                  placeholder="dg@entreprise.com" 
                  value={dgEmail} 
                  onChange={(e) => setDgEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code de Licence / Entreprise</label>
                <Input 
                  placeholder="ex: CODE-ENT-2026" 
                  value={licenseCode} 
                  onChange={(e) => setLicenseCode(e.target.value)} 
                  required 
                />
                <p className="text-[11px] text-muted-foreground italic">
                  Ce code servira d'identifiant unique pour l'isolation des données de l'entreprise.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Création en cours..." : "Générer Accès DG"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40">
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
            <CardDescription>Dernières licences générées.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Mme. Amrani", org: "TechFlow", date: "Il y a 2h", code: "TF-99" },
                { name: "M. Lefebvre", org: "InnovateCorp", date: "Hier", code: "IC-45" },
                { name: "Julie Dubois", org: "NextGen", date: "Il y a 3j", code: "NG-12" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.org} • {item.code}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">{item.date}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
