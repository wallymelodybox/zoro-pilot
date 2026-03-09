"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/hooks/use-user"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Shield, UserPlus, Key, Building, Activity, Clock, AlertCircle, LogOut, Users, Globe, Trash2, X, Eye, RotateCcw, Copy } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createDGAccount, deleteOrganization, getOrganizationsWithDetails, resetDGPassword } from "./actions"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export default function BackOfficePage() {
  const { user, loading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [dgEmail, setDgEmail] = useState("")
  const [dgName, setDgName] = useState("")
  const [orgName, setOrgName] = useState("")
  const [licenseType, setLicenseType] = useState("mensuelle")
  const [creating, setCreating] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [totalProfiles, setTotalProfiles] = useState(0)
  const [fetching, setFetching] = useState(true)
  const supabase = createClient()

  // Dialog states
  const [activeDialog, setActiveDialog] = useState<'orgs' | 'users' | 'active' | 'pending' | null>(null)
  const [orgDetails, setOrgDetails] = useState<any[]>([])
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [orphanProfiles, setOrphanProfiles] = useState<any[]>([])

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Reset password
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [resetNewPassword, setResetNewPassword] = useState<string | null>(null)
  const [resetTargetName, setResetTargetName] = useState<string | null>(null)

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

      // Compter le nombre total de profils (utilisateurs actifs)
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      setTotalProfiles(count || 0)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setFetching(false)
    }
  }

  const openDialog = useCallback(async (type: 'orgs' | 'users' | 'active' | 'pending') => {
    setActiveDialog(type)
    const res = await getOrganizationsWithDetails()
    if (res.error) {
      toast.error(res.error)
      return
    }
    setOrgDetails(res.organizations || [])
    setAllProfiles(res.allProfiles || [])
    setOrphanProfiles(res.orphanProfiles || [])
  }, [])

  const handleResetPassword = async (profileId: string, profileName: string) => {
    setResettingId(profileId)
    const res = await resetDGPassword(profileId)
    if (res.error) {
      toast.error(res.error)
    } else {
      setResetNewPassword(res.newPassword ?? null)
      setResetTargetName(profileName)
      toast.success(res.message)
    }
    setResettingId(null)
  }

  const handleDeleteOrg = async () => {
    if (!deleteTarget || !deletePassword) return
    setDeleting(true)
    const res = await deleteOrganization(deleteTarget.id, deletePassword)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.message)
      setOrganizations(prev => prev.filter(org => org.id !== deleteTarget.id))
      setDeleteTarget(null)
      setDeletePassword("")
      await fetchStats()
      // Refresh dialog data
      const updated = await getOrganizationsWithDetails()
      if (!updated.error) {
        setOrgDetails(updated.organizations || [])
        setAllProfiles(updated.allProfiles || [])
        setOrphanProfiles(updated.orphanProfiles || [])
      }
    }
    setDeleting(false)
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
    setCreatedPassword(null)

    const formData = new FormData()
    formData.append('name', dgName)
    formData.append('email', dgEmail)
    formData.append('orgName', orgName)
    formData.append('licenseType', licenseType)

    try {
      const res = await createDGAccount(formData)

      if (res.error) {
        toast.error(res.error)
      } else if (res.success) {
        toast.success(res.message)
        setCreatedPassword(res.tempPassword ?? null)
        setDgEmail("")
        setDgName("")
        setOrgName("")
        setLicenseType("mensuelle")
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

      {/* Platform Metrics (cliquables) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'orgs' as const, icon: <Building className="h-6 w-6" />, color: 'blue', label: 'Organisations', value: organizations.length },
          { key: 'users' as const, icon: <Users className="h-6 w-6" />, color: 'purple', label: 'Utilisateurs', value: totalProfiles },
          { key: 'active' as const, icon: <Key className="h-6 w-6" />, color: 'emerald', label: 'Licences actives', value: organizations.filter(o => o.setup_completed).length },
          { key: 'pending' as const, icon: <AlertCircle className="h-6 w-6" />, color: 'amber', label: 'En attente', value: organizations.filter(o => !o.setup_completed).length },
        ].map(card => (
          <Card
            key={card.key}
            className="bg-card/20 backdrop-blur-xl border-border/40 shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/30 hover:shadow-md"
            onClick={() => openDialog(card.key)}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl bg-${card.color}-500/10 flex items-center justify-center text-${card.color}-500`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{card.label}</p>
                <h3 className="text-xl font-bold">{card.value}</h3>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground/40 ml-auto" />
            </CardContent>
          </Card>
        ))}
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
            <div className="mt-4">
              <Progress
                value={Math.round((organizations.filter(o => o.setup_completed).length / (organizations.length || 1)) * 100)}
                className="h-1.5 bg-muted"
                indicatorClassName="bg-green-500"
              />
            </div>
            <p className="text-[10px] text-green-500 mt-2 font-black uppercase tracking-widest">
              {organizations.length > 0 ? `${Math.round((organizations.filter(o => o.setup_completed).length / organizations.length) * 100)}% opérationnelles` : "Aucune organisation"}
            </p>
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
                    className="h-12 rounded-xl bg-background/50 border-border/40"
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
                    className="h-12 rounded-xl bg-background/50 border-border/40"
                    value={dgEmail}
                    onChange={(e) => setDgEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Nom de l&apos;organisation</label>
                  <Input
                    placeholder="ex: Acme Corp"
                    className="h-12 rounded-xl bg-background/50 border-border/40"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Type de licence</label>
                  <select
                    title="Type de licence"
                    className="h-12 w-full rounded-xl bg-background/50 border border-border/40 px-3 text-sm"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                  >
                    <option value="mensuelle">Mensuelle (30j)</option>
                    <option value="trimestrielle">Trimestrielle (90j)</option>
                    <option value="semestrielle">Semestrielle (180j)</option>
                    <option value="annuelle">Annuelle (365j)</option>
                    <option value="definitive">Définitive (illimitée)</option>
                  </select>
                </div>
              </div>

              {/* Affichage du mot de passe temporaire après création */}
              {createdPassword && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-2">
                  <p className="text-sm font-bold text-green-500">✅ Compte créé avec succès</p>
                  <p className="text-xs text-muted-foreground">Mot de passe temporaire (à transmettre au DG) :</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-background/80 px-3 py-2 text-sm font-mono select-all border border-border/40">
                      {createdPassword}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(createdPassword)
                        toast.success("Mot de passe copié !")
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">⚠️ Ce mot de passe ne sera plus affiché après fermeture.</p>
                </div>
              )}

              <Button type="submit" className="w-full h-12 rounded-xl font-black text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={creating}>
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Initialisation...
                  </div>
                ) : "GÉNÉRER ACCÈS DG"}
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
      {/* ── DIALOG: Organisations ── */}
      <Dialog open={activeDialog === 'orgs'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Organisations ({orgDetails.length})</DialogTitle>
            <DialogDescription>Liste de toutes les organisations avec leurs utilisateurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {orgDetails.map(org => (
              <div key={org.id} className="rounded-xl border border-border/40 bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{org.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {org.user_count} utilisateur{org.user_count > 1 ? 's' : ''} · Licence: {org.license_type || 'non définie'} · {org.setup_completed ? '✅ Active' : '⏳ En attente'}
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => { setDeleteTarget(org); setDeletePassword("") }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
                  </Button>
                </div>
                {org.users && org.users.length > 0 && (
                  <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-border/30">
                    {org.users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{u.name}</span>
                          <span className="text-muted-foreground ml-2">{u.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {(u.rbac_role === 'admin' || u.rbac_role === 'executive') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={resettingId === u.id}
                              onClick={() => handleResetPassword(u.id, u.name)}
                            >
                              <RotateCcw className={cn("h-3 w-3", resettingId === u.id && "animate-spin")} />
                              {resettingId === u.id ? "..." : "Reset MDP"}
                            </Button>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{u.role || u.rbac_role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {orgDetails.length === 0 && <p className="text-center text-muted-foreground py-6">Aucune organisation</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Utilisateurs ── */}
      <Dialog open={activeDialog === 'users'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Utilisateurs ({allProfiles.length})</DialogTitle>
            <DialogDescription>Tous les utilisateurs de la plateforme</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            {allProfiles.map((u: any) => {
              const org = orgDetails.find(o => o.id === u.organization_id)
              return (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-card/30 px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium">{org?.name || '—'}</div>
                    <div className="text-[10px] text-muted-foreground">{u.role || u.rbac_role}</div>
                  </div>
                </div>
              )
            })}
            {orphanProfiles.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/30">
                <p className="text-xs font-bold text-amber-500 mb-2">⚠️ Profils sans organisation ({orphanProfiles.length})</p>
                {orphanProfiles.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 mb-1">
                    <div className="text-sm">{u.name} <span className="text-muted-foreground">({u.email})</span></div>
                    <span className="text-xs text-amber-500">{u.rbac_role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Licences actives ── */}
      <Dialog open={activeDialog === 'active'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Licences actives</DialogTitle>
            <DialogDescription>Organisations avec licence configurée</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {orgDetails.filter(o => o.setup_completed).map(org => (
              <div key={org.id} className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div>
                  <div className="font-medium text-sm">{org.name}</div>
                  <div className="text-xs text-muted-foreground">{org.user_count} utilisateur{org.user_count > 1 ? 's' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-emerald-500">{org.license_type || '—'}</div>
                  <div className="text-[10px] text-muted-foreground">{org.expires_at ? `Expire: ${new Date(org.expires_at).toLocaleDateString('fr-FR')}` : 'Illimitée'}</div>
                </div>
              </div>
            ))}
            {orgDetails.filter(o => o.setup_completed).length === 0 && <p className="text-center text-muted-foreground py-6">Aucune licence active</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: En attente ── */}
      <Dialog open={activeDialog === 'pending'} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>En attente</DialogTitle>
            <DialogDescription>Organisations non configurées ou en attente d&apos;activation</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {orgDetails.filter(o => !o.setup_completed).map(org => (
              <div key={org.id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <div>
                  <div className="font-medium text-sm">{org.name}</div>
                  <div className="text-xs text-muted-foreground">{org.user_count} utilisateur{org.user_count > 1 ? 's' : ''} · Créée le {new Date(org.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 font-medium">En attente</span>
              </div>
            ))}
            {orgDetails.filter(o => !o.setup_completed).length === 0 && <p className="text-center text-muted-foreground py-6">Aucune organisation en attente</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Nouveau mot de passe ── */}
      <Dialog open={!!resetNewPassword} onOpenChange={() => { setResetNewPassword(null); setResetTargetName(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau mot de passe</DialogTitle>
            <DialogDescription>
              Mot de passe réinitialisé pour <strong>{resetTargetName}</strong>. Transmettez-le au DG.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-background/80 px-3 py-2.5 text-sm font-mono select-all border border-border/40 break-all">
                {resetNewPassword}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(resetNewPassword || "")
                  toast.success("Mot de passe copié !")
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copier
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Ce mot de passe ne sera plus affiché après fermeture de cette fenêtre.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Confirmation suppression ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => { setDeleteTarget(null); setDeletePassword("") }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer l&apos;organisation</DialogTitle>
            <DialogDescription>
              Vous allez supprimer <strong>{deleteTarget?.name}</strong> et tous ses utilisateurs ({deleteTarget?.user_count || 0}).
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs text-destructive font-medium">⚠️ Seront supprimés :</p>
              <ul className="text-xs text-muted-foreground mt-1 ml-4 list-disc space-y-0.5">
                <li>L&apos;organisation et sa configuration</li>
                <li>Tous les profils utilisateurs ({deleteTarget?.user_count || 0})</li>
                <li>Tous les comptes Auth associés</li>
                <li>Tous les canaux et messages</li>
              </ul>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Entrez votre mot de passe pour confirmer</label>
              <Input
                type="password"
                placeholder="Votre mot de passe super admin"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-background/50 border-border/40"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeletePassword("") }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrg} disabled={!deletePassword || deleting}>
              {deleting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Suppression...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Supprimer définitivement
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
