"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Image as ImageIcon, Sparkles, Rocket } from "lucide-react"
import { completeOnboarding } from "./actions"
import { ThemeBackground } from "@/components/theme/theme-background"
import { useUser } from "@/hooks/use-user"

export default function OnboardingPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState(user?.name || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "")
  const [orgName, setOrgName] = useState(user?.organization_name || "")
  const [logoUrl, setLogoUrl] = useState(user?.organization_logo || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData()
    formData.append('userName', userName)
    formData.append('avatarUrl', avatarUrl)
    formData.append('orgName', orgName)
    formData.append('logoUrl', logoUrl)
    
    try {
      await completeOnboarding(formData)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center relative overflow-hidden bg-background">
      <ThemeBackground />
      
      <div className="relative z-10 w-full max-w-lg p-6">
        <Card className="border-border/40 bg-card/40 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight">Bienvenue sur Zoro Pilot</CardTitle>
              <CardDescription className="text-base">
                Configurons votre identité et votre espace de travail.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Profil Personnel */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Votre Profil
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      Votre Nom Complet
                    </Label>
                    <Input 
                      id="userName"
                      placeholder="Menann Zoro" 
                      className="h-11 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      Photo de profil (URL)
                    </Label>
                    <Input 
                      id="avatarUrl"
                      placeholder="https://..." 
                      className="h-11 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Organisation */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Votre Organisation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      Nom de l'entreprise
                    </Label>
                    <Input 
                      id="orgName"
                      placeholder="ex: Acme Corp" 
                      className="h-11 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                      Logo de l'entreprise (URL)
                    </Label>
                    <Input 
                      id="logoUrl"
                      placeholder="https://..." 
                      className="h-11 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full h-14 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={loading || !orgName || !logoUrl || !userName}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Initialisation de l'espace...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Rocket className="h-5 w-5" />
                      Lancer mon Zoro Pilot
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
