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
  const [orgName, setOrgName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData()
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
      
      <div className="relative z-10 w-full max-w-md p-6">
        <Card className="border-border/40 bg-card/40 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight">Bienvenue, {user?.name}</CardTitle>
              <CardDescription className="text-base">
                Configurons votre espace Zoro Pilot pour votre organisation.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Nom de l'organisation
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="orgName"
                    placeholder="ex: Acme Corp" 
                    className="h-12 pl-11 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20 text-lg font-medium"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  URL du logo (SVG ou PNG)
                </Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="logoUrl"
                    placeholder="https://votre-site.com/logo.png" 
                    className="h-12 pl-11 rounded-xl bg-background/50 border-border/40 focus:ring-primary/20"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground italic mt-2 ml-1">
                  💡 Ce logo sera affiché pour vous et tous vos employés.
                </p>
              </div>

              <Button type="submit" className="w-full h-14 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={loading || !orgName || !logoUrl}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Initialisation de votre espace...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Lancer mon Zoro Pilot
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
