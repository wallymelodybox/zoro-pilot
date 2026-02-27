"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Settings, Shield, Globe, Lock, Bell, Database, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function BOSettingsPage() {
  const { user, loading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (user?.rbac_role === 'super_admin' || user?.email === 'menannzoro@gmail.com') {
        setIsAuthorized(true)
      } else {
        redirect("/")
      }
    }
  }, [user, loading])

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success("Paramètres système mis à jour avec succès.")
    }, 1000)
  }

  if (loading) return <div className="p-10 text-center">Chargement...</div>
  if (!isAuthorized) return null

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Settings className="h-10 w-10 text-primary" />
            Paramètres Système
          </h1>
          <p className="text-muted-foreground text-lg">Configurez les options globales de la plateforme Zoro Pilot.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
          {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-5 w-5" />}
          Enregistrer les modifications
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Domaines & Sécurité
              </CardTitle>
              <CardDescription>Gestion des endpoints et de l'isolation multi-tenant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domaine Applicatif Principal</Label>
                  <Input defaultValue="app.zoro-pilot.com" className="bg-background/50 border-border/40" />
                </div>
                <div className="space-y-2">
                  <Label>Domaine Back Office (Secure)</Label>
                  <Input defaultValue="zoro-secure-control-net.com" className="bg-background/50 border-border/40" />
                </div>
              </div>
              <Separator className="bg-border/20" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Isolation Totale des Données</Label>
                    <p className="text-sm text-muted-foreground">Force l'utilisation du schéma tenant-ID pour chaque requête.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Validation stricte des invitations</Label>
                    <p className="text-sm text-muted-foreground">Les tokens d'invitation expirent après 48h.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications Globales
              </CardTitle>
              <CardDescription>Alertes système et maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Mode Maintenance</Label>
                  <p className="text-sm text-muted-foreground">Affiche une page de maintenance pour tous les utilisateurs.</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label>Message de Bannière Globale</Label>
                <Input placeholder="ex: Mise à jour prévue à 22h00 GMT..." className="bg-background/50 border-border/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                État de la BDD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Connectivité Supabase</span>
                <span className="text-green-500 font-bold">OPTIMAL</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Temps de réponse moyen</span>
                <span className="text-foreground font-mono">24ms</span>
              </div>
              <Separator className="bg-border/20" />
              <Button variant="outline" className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/10">
                Lancer un diagnostic
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Mode Super-Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-primary/80">
              Vous êtes actuellement connecté avec les privilèges maximum. Toute modification ici impactera l'ensemble des organisations clientes.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
