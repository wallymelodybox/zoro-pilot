"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, Search, Filter, Building, Key, CheckCircle2, XCircle, Clock, Calendar, Edit3, Save, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type LicenseType = 'mensuelle' | 'trimestrielle' | 'semestrielle' | 'annuelle' | 'definitive'

export default function LicensesPage() {
  const { user, loading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [organizations, setOrganizations] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editLicenseType, setEditLicenseType] = useState<LicenseType>('mensuelle')
  const [editExpiryDate, setEditExpiryDate] = useState("")
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (!loading) {
      if (user?.rbac_role === 'super_admin' || user?.email === 'menannzoro@gmail.com') {
        setIsAuthorized(true)
        fetchOrganizations()
      } else {
        redirect("/")
      }
    }
  }, [user, loading])

  async function fetchOrganizations() {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error("Error fetching organizations:", error)
      toast.error("Erreur lors de la récupération des organisations")
    } finally {
      setFetching(false)
    }
  }

  const handleOpenDetails = (org: any) => {
    setSelectedOrg(org)
    setEditLicenseType(org.license_type || 'mensuelle')
    if (org.expires_at) {
      setEditExpiryDate(new Date(org.expires_at).toISOString().split('T')[0])
    } else {
      setEditExpiryDate("")
    }
    setIsDetailsOpen(true)
  }

  const handleUpdateLicense = async () => {
    if (!selectedOrg) return
    setSaving(true)
    
    try {
      const updates: any = {
        license_type: editLicenseType,
        expires_at: editLicenseType === 'definitive' ? null : new Date(editExpiryDate).toISOString()
      }

      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', selectedOrg.id)

      if (error) throw error
      
      toast.success("Licence mise à jour avec succès")
      setIsDetailsOpen(false)
      fetchOrganizations()
    } catch (error) {
      console.error("Error updating license:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  if (loading || fetching) return <div className="p-10 text-center">Chargement des licences...</div>
  if (!isAuthorized) return null

  const filteredOrgs = organizations.filter(org => 
    org.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRemainingDays = (expiryDate: string | null) => {
    if (!expiryDate) return null
    const diff = new Date(expiryDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          Gestion des Licences
        </h1>
        <p className="text-muted-foreground text-lg">Consultez et gérez toutes les organisations et leurs accès.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une organisation..." 
            className="h-12 pl-11 rounded-xl bg-card/40 border-border/40 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 rounded-xl border-border/40 gap-2">
          <Filter className="h-5 w-5" />
          Filtres
        </Button>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des Organisations</CardTitle>
              <CardDescription>Total: {organizations.length} organisations enregistrées</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {organizations.filter(o => o.setup_completed).length} Actives
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                <Clock className="h-3.5 w-3.5" />
                {organizations.filter(o => !o.setup_completed).length} En attente
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20 bg-muted/5">
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Organisation</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Type Licence</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Expiration</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredOrgs.length > 0 ? filteredOrgs.map((org) => {
                  const daysLeft = getRemainingDays(org.expires_at)
                  return (
                    <tr key={org.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {org.logo_url ? (
                            <div className="h-10 w-10 rounded-xl overflow-hidden border border-border/40">
                              <img src={org.logo_url} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/10">
                              {org.name?.charAt(0) || "O"}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-foreground">{org.name || "En attente..."}</div>
                            <div className="text-xs text-muted-foreground">ID: {org.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="capitalize bg-muted/30">
                          {org.license_type || 'mensuelle'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {org.license_type === 'definitive' ? (
                          <span className="text-sm font-medium text-primary">À vie</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="text-sm text-muted-foreground">
                              {org.expires_at ? new Date(org.expires_at).toLocaleDateString('fr-FR') : "N/A"}
                            </div>
                            {daysLeft !== null && (
                              <div className={cn(
                                "text-[10px] font-bold uppercase",
                                daysLeft <= 7 ? "text-destructive" : daysLeft <= 15 ? "text-amber-500" : "text-green-500"
                              )}>
                                {daysLeft > 0 ? `${daysLeft} jours restants` : "Expiré"}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          org.setup_completed 
                            ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        )}>
                          {org.setup_completed ? "Actif" : "Configuration"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleOpenDetails(org)}
                        >
                          Détails
                        </Button>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                      Aucune organisation trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-125 bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              {selectedOrg?.name || "Détails de l'organisation"}
            </DialogTitle>
            <DialogDescription>
              Gérez les paramètres de licence et les délais d'accès.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ID Organisation</span>
                <span className="font-mono text-xs">{selectedOrg?.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date de création</span>
                <span>{selectedOrg?.created_at && new Date(selectedOrg.created_at).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Statut système</span>
                <Badge className={selectedOrg?.setup_completed ? "bg-green-500/20 text-green-500 border-green-500/20" : "bg-amber-500/20 text-amber-500 border-amber-500/20"}>
                  {selectedOrg?.setup_completed ? "OPÉRATIONNEL" : "EN CONFIGURATION"}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type de Licence</Label>
                <Select value={editLicenseType} onValueChange={(v: LicenseType) => setEditLicenseType(v)}>
                  <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/40">
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensuelle">Mensuelle</SelectItem>
                    <SelectItem value="trimestrielle">Trimestrielle</SelectItem>
                    <SelectItem value="semestrielle">Semestrielle</SelectItem>
                    <SelectItem value="annuelle">Annuelle</SelectItem>
                    <SelectItem value="definitive">Définitive (À vie)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editLicenseType !== 'definitive' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date d'expiration</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="date" 
                      className="h-12 pl-11 rounded-xl bg-background/50 border-border/40"
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDetailsOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleUpdateLicense} disabled={saving} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
              {saving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
