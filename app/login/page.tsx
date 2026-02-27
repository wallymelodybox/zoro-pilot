"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Chrome, Apple, Command, Globe, CheckCircle2, Beaker } from "lucide-react"
import { login, signup } from "./actions"
import { LoginCarousel } from "./login-carousel"
import { useRouter } from "next/navigation"

// Microsoft icon custom component
function MicrosoftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 23 23" {...props}>
      <path fill="#f35325" d="M1 1h10v10H1z"/>
      <path fill="#81bc06" d="M12 1h10v10H12z"/>
      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
      <path fill="#ffba08" d="M12 12h10v10H12z"/>
    </svg>
  )
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const router = useRouter()

  const handleLogin = async (formData: FormData) => {
    await login(formData)
  }

  const handleDemoMode = () => {
    // Set bypass flag in localStorage
    localStorage.setItem('zoro_demo_owner', 'true')
    // Redirect directly to BO
    router.push('/bo-zoro-control-2026-secure')
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Panel - Branding & Marketing */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <LoginCarousel />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Command className="mr-2 h-6 w-6" />
          ZORO PILOT
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5">
          
          {/* Header & Language Selector */}
          <div className="flex flex-col space-y-2 text-center relative">
            <div className="absolute -top-16 right-0">
               <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                 <Globe className="h-4 w-4" />
                 Français
               </Button>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Connexion à votre espace
            </h1>
            <p className="text-sm text-muted-foreground">
              L'accès à Zoro Pilot se fait exclusivement sur invitation.
            </p>
            {searchParams?.error ? (
              <div className="mt-2 text-sm text-destructive wrap-break-word p-2 bg-destructive/10 rounded-lg">
                {searchParams.error}
              </div>
            ) : null}
          </div>

          <div className="w-full space-y-6">
            <div className="grid gap-6">
              <form action={handleLogin}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email professionnel</Label>
                    <Input
                      id="email"
                      name="email"
                      placeholder="nom@entreprise.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Mot de passe / Code d'accès</Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="password" 
                      required 
                    />
                  </div>
                  <Button type="submit">
                    Se connecter
                  </Button>
                </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground italic">
                    Invitation requise pour tout nouvel accès
                  </span>
                </div>
              </div>

              {/* DEMO LOGIN BUTTON - Bypass for Owner */}
              <Button 
                variant="secondary" 
                className="w-full bg-emerald-100/50 text-emerald-800 hover:bg-emerald-200/50 border border-emerald-200/50" 
                onClick={handleDemoMode}
              >
                <Beaker className="mr-2 h-4 w-4" />
                Accès Direct Back Office (Démo Propriétaire)
              </Button>
            </div>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            En continuant, vous acceptez nos{" "}
            <a href="/terms" className="underline underline-offset-4 hover:text-primary">
              Conditions d'utilisation
            </a>{" "}
            et notre{" "}
            <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Politique de confidentialité
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
