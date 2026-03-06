"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, Globe, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { login } from "./actions"
import { LoginCarousel } from "./login-carousel"
import { use } from "react"

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const resolvedSearchParams = use(searchParams)
  
  const isBORoute = resolvedSearchParams?.next?.includes('bo-zoro-control-2026-secure')

  const handleLogin = async (formData: FormData) => {
    // We'll pass the next param to the login action
    if (resolvedSearchParams?.next) {
      formData.append('next', resolvedSearchParams.next)
    }
    await login(formData)
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Panel - Branding & Marketing */}
      <div className={cn(
        "relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r transition-colors duration-1000",
        isBORoute ? "bg-slate-950" : "bg-muted"
      )}>
        <LoginCarousel />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Command className="mr-2 h-6 w-6" />
          {isBORoute ? "ZORO ADMIN" : "ZORO PILOT"}
        </div>
        {isBORoute && (
          <div className="absolute inset-0 bg-linear-to-b from-primary/10 to-transparent pointer-events-none" />
        )}
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
            <div className="flex justify-center mb-2">
               {isBORoute ? (
                 <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                   <Shield className="h-6 w-6 text-primary" />
                 </div>
               ) : (
                 <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center">
                   <Command className="h-6 w-6 text-foreground/50" />
                 </div>
               )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isBORoute ? "Accès Back Office" : "Connexion à votre espace"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isBORoute 
                ? "Connectez-vous avec vos identifiants Super Admin." 
                : "L'accès à Zoro Pilot se fait exclusivement sur invitation."
              }
            </p>
            {resolvedSearchParams?.error ? (
              <div className="mt-2 text-sm text-destructive wrap-break-word p-2 bg-destructive/10 rounded-lg">
                {resolvedSearchParams.error}
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
