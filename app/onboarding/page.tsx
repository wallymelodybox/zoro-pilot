"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Sparkles, Rocket, ChevronRight, ChevronLeft, Check,
  Building2, Briefcase, GraduationCap, ShoppingCart, Factory, Truck, Globe, Code,
  TrendingUp, Target, Heart, UserPlus, Repeat, BarChart3
} from "lucide-react"
import { completeOnboarding } from "./actions"
import { ThemeBackground } from "@/components/theme/theme-background"
import { useUser } from "@/hooks/use-user"
import { AvatarUpload } from "@/components/avatar-upload"
import { cn } from "@/lib/utils"
import {
  COMPANY_PROFILES,
  QUARTERLY_OBJECTIVES,
  sortKpisByObjective,
  type CompanyProfile,
  type QuarterlyObjective,
  type KPI,
} from "@/lib/kpi-packs"

const PROFILE_ICONS: Record<string, React.ReactNode> = {
  Building2: <Building2 className="h-6 w-6" />,
  Briefcase: <Briefcase className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  ShoppingCart: <ShoppingCart className="h-6 w-6" />,
  Factory: <Factory className="h-6 w-6" />,
  Truck: <Truck className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
  Code: <Code className="h-6 w-6" />,
}

const OBJECTIVE_ICONS: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  PiggyBank: <BarChart3 className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  UserPlus: <UserPlus className="h-5 w-5" />,
  Repeat: <Repeat className="h-5 w-5" />,
  Globe: <Globe className="h-5 w-5" />,
}

const STEPS = [
  { id: 0, label: "Bienvenue" },
  { id: 1, label: "Profil" },
  { id: 2, label: "Sous-profil" },
  { id: 3, label: "Objectif" },
  { id: 4, label: "KPIs" },
  { id: 5, label: "Dashboard" },
]

export default function OnboardingPage() {
  const { user, loading: userLoading } = useUser()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Step 0 – identity
  const [userName, setUserName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [orgName, setOrgName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  // Sync with user data once loaded
  useEffect(() => {
    if (user) {
      if (!userName) setUserName(user.name || "")
      if (!avatarUrl) setAvatarUrl(user.avatar_url || "")
      if (!orgName) setOrgName(user.organization_name || "")
      if (!logoUrl) setLogoUrl(user.organization_logo || "")
    }
  }, [user])

  // Step 1 – company profile
  const [selectedProfile, setSelectedProfile] = useState<CompanyProfile | null>(null)
  // Step 2 – sub-profile
  const [selectedSubProfile, setSelectedSubProfile] = useState<string | null>(null)
  // Step 3 – quarterly objective
  const [selectedObjective, setSelectedObjective] = useState<QuarterlyObjective | null>(null)
  // Step 4 – KPI selection
  const [selectedKpiIds, setSelectedKpiIds] = useState<Set<string>>(new Set())

  const profileConfig = useMemo(
    () => COMPANY_PROFILES.find(p => p.id === selectedProfile),
    [selectedProfile]
  )

  // When profile changes, pre-select all its KPIs
  const sortedKpis = useMemo(() => {
    if (!profileConfig) return []
    const kpis = profileConfig.kpis
    return selectedObjective ? sortKpisByObjective(kpis, selectedObjective) : kpis
  }, [profileConfig, selectedObjective])

  // Initialize KPIs when entering step 4
  const initKpis = () => {
    if (profileConfig && selectedKpiIds.size === 0) {
      setSelectedKpiIds(new Set(profileConfig.kpis.map(k => k.id)))
    }
  }

  const toggleKpi = (id: string) => {
    setSelectedKpiIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!(userName && orgName)
      case 1: return !!selectedProfile
      case 2: return true // sub-profile is optional
      case 3: return !!selectedObjective
      case 4: return selectedKpiIds.size > 0
      default: return true
    }
  }

  const goNext = () => {
    if (step === 3) initKpis()
    if (step < STEPS.length - 1) setStep(step + 1)
  }
  const goBack = () => { if (step > 0) setStep(step - 1) }

  const handleFinish = async () => {
    if (loading) return
    setLoading(true)
    const formData = new FormData()
    formData.append("userName", userName)
    formData.append("avatarUrl", avatarUrl)
    formData.append("orgName", orgName)
    formData.append("logoUrl", logoUrl)
    formData.append("companyProfile", selectedProfile || "")
    formData.append("subProfile", selectedSubProfile || "")
    formData.append("quarterlyObjective", selectedObjective || "")
    formData.append("selectedKpis", JSON.stringify(Array.from(selectedKpiIds)))
    
    try {
      console.log("Submitting onboarding...")
      const result = await completeOnboarding(formData)
      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
      }
    } catch (error) {
      console.error("Onboarding error:", error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-background py-8">
      <ThemeBackground />

      <div className="relative z-10 w-full max-w-2xl px-4">
        {/* Progress bar */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "h-2.5 w-2.5 rounded-full transition-all",
                i < step ? "bg-primary" : i === step ? "bg-primary scale-125" : "bg-muted-foreground/30"
              )} />
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-6 rounded-full transition-all", i < step ? "bg-primary" : "bg-muted-foreground/20")} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mb-4 font-medium">
          Étape {step + 1}/{STEPS.length} — {STEPS[step].label}
        </p>

        <Card className="border-border/40 bg-card/40 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="text-center space-y-3 pb-2">
            {step === 0 && (
              <>
                <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Bienvenue, Directeur Général</CardTitle>
                <CardDescription className="text-base">Configurez votre cockpit en 2 minutes</CardDescription>
              </>
            )}
            {step === 1 && (
              <>
                <CardTitle className="text-xl font-bold">Quel est votre type d&apos;activité ?</CardTitle>
                <CardDescription>Choisissez votre profil d&apos;entreprise</CardDescription>
              </>
            )}
            {step === 2 && (
              <>
                <CardTitle className="text-xl font-bold">Précisez votre contexte</CardTitle>
                <CardDescription>Sous-profil (optionnel)</CardDescription>
              </>
            )}
            {step === 3 && (
              <>
                <CardTitle className="text-xl font-bold">Objectif trimestriel principal</CardTitle>
                <CardDescription>Zoro adaptera votre dashboard à cette priorité</CardDescription>
              </>
            )}
            {step === 4 && (
              <>
                <CardTitle className="text-xl font-bold">Vos KPIs recommandés</CardTitle>
                <CardDescription>Décochez ceux que vous ne souhaitez pas suivre</CardDescription>
              </>
            )}
            {step === 5 && (
              <>
                <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">Votre cockpit est prêt !</CardTitle>
                <CardDescription>{selectedKpiIds.size} KPIs · {profileConfig?.label} · {QUARTERLY_OBJECTIVES.find(o => o.id === selectedObjective)?.label}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="pt-2">
            {/* ── STEP 0: Welcome / Identity ── */}
            {step === 0 && <StepIdentity {...{ userName, setUserName, avatarUrl, setAvatarUrl, orgName, setOrgName, logoUrl, setLogoUrl, user }} />}

            {/* ── STEP 1: Company Profile ── */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {COMPANY_PROFILES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProfile(p.id); setSelectedSubProfile(null); setSelectedKpiIds(new Set()) }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all hover:border-primary/40 hover:bg-primary/5",
                      selectedProfile === p.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border/40 bg-background/50"
                    )}
                  >
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", selectedProfile === p.id ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground")}>
                      {PROFILE_ICONS[p.icon] || <Building2 className="h-6 w-6" />}
                    </div>
                    <span className="text-sm font-semibold">{p.label}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">{p.description}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP 2: Sub-profile ── */}
            {step === 2 && profileConfig && (
              <div className="space-y-3">
                {profileConfig.subProfiles.map(sp => (
                  <button
                    key={sp.id}
                    onClick={() => setSelectedSubProfile(sp.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-primary/40",
                      selectedSubProfile === sp.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border/40 bg-background/50"
                    )}
                  >
                    <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", selectedSubProfile === sp.id ? "border-primary" : "border-muted-foreground/40")}>
                      {selectedSubProfile === sp.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-medium">{sp.label}</span>
                  </button>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-2">Vous pouvez passer cette étape</p>
              </div>
            )}

            {/* ── STEP 3: Quarterly Objective ── */}
            {step === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUARTERLY_OBJECTIVES.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjective(obj.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary/40",
                      selectedObjective === obj.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border/40 bg-background/50"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-xl shrink-0 flex items-center justify-center", selectedObjective === obj.id ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground")}>
                      {OBJECTIVE_ICONS[obj.icon] || <Target className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{obj.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{obj.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP 4: KPI Pack ── */}
            {step === 4 && (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {sortedKpis.map((kpi: KPI) => {
                  const checked = selectedKpiIds.has(kpi.id)
                  return (
                    <button
                      key={kpi.id}
                      onClick={() => toggleKpi(kpi.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border p-3 transition-all text-left",
                        checked ? "border-primary/30 bg-primary/5" : "border-border/30 bg-background/30 opacity-60"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}>
                        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{kpi.label}</div>
                        <div className="text-[11px] text-muted-foreground">{kpi.category} · {kpi.unit}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── STEP 5: Summary / Generate ── */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                    <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Entreprise</div>
                    <div className="font-semibold">{orgName}</div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                    <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Profil</div>
                    <div className="font-semibold">{profileConfig?.label}</div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                    <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Objectif</div>
                    <div className="font-semibold">{QUARTERLY_OBJECTIVES.find(o => o.id === selectedObjective)?.label}</div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                    <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">KPIs actifs</div>
                    <div className="font-semibold">{selectedKpiIds.size}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-2">
                    <Sparkles className="h-4 w-4" />
                    Zoro va configurer automatiquement :
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Widgets & layout du dashboard adaptés</li>
                    <li>Alertes & seuils par défaut</li>
                    <li>KPIs prioritaires selon votre objectif</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className="flex items-center justify-between pt-6 gap-3">
              {step > 0 ? (
                <Button variant="outline" onClick={goBack} className="rounded-xl h-12">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                </Button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <Button onClick={goNext} disabled={!canNext()} className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
                  Continuer <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={loading} className="rounded-xl h-14 px-8 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Génération...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Rocket className="h-5 w-5" />
                      Générer mon dashboard
                    </div>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Step 0 sub-component ────────────────────────────────────────────────────

function StepIdentity({ userName, setUserName, avatarUrl, setAvatarUrl, orgName, setOrgName, logoUrl, setLogoUrl, user }: {
  userName: string; setUserName: (v: string) => void;
  avatarUrl: string; setAvatarUrl: (v: string) => void;
  orgName: string; setOrgName: (v: string) => void;
  logoUrl: string; setLogoUrl: (v: string) => void;
  user: any;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          Votre Profil
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nom complet</Label>
            <Input id="userName" placeholder="Menann Zoro" className="h-11 rounded-xl bg-background/50 border-border/40" value={userName} onChange={(e) => setUserName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Photo de profil</Label>
            <div className="flex justify-center pt-2">
              <AvatarUpload uid={user?.id || null} url={avatarUrl} size={80} onUpload={(url) => setAvatarUrl(url)} />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          Organisation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nom entreprise</Label>
            <Input id="orgName" placeholder="ex: Acme Corp" className="h-11 rounded-xl bg-background/50 border-border/40" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Logo (URL)</Label>
            <Input id="logoUrl" placeholder="https://..." className="h-11 rounded-xl bg-background/50 border-border/40" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
