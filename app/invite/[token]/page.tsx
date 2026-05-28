"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Loader2, Mail, Building, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export default function InvitePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'signup'>('loading')
  const [inviteData, setInviteData] = useState<any>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function validateInvite() {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .or(`token.eq.${params.token},invite_code.eq.${params.token}`)
        .maybeSingle()

      if (error || !data) {
        console.error('Invite lookup error:', error, 'token:', params.token)
        setStatus('invalid')
        return
      }

      if (data.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', data.organization_id)
          .maybeSingle()
        if (org) (data as any).organizations = org
      }

      if (data.is_used) {
        setStatus('used')
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setStatus('expired')
        return
      }

      setInviteData(data)
      setName(data.invited_email.split('@')[0])
      setStatus('valid')
    }

    validateInvite()
  }, [params.token])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.invited_email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      })

      if (signUpError) {
        toast.error(signUpError.message)
        setLoading(false)
        return
      }

      toast.success("Compte créé avec succès!")
      router.push('/')
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de la création du compte.")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    setStatus('signup')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-2xl border-border/40 bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            {status === 'loading' && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
            {status === 'valid' && <ShieldCheck className="h-8 w-8 text-primary" />}
            {status === 'signup' && <CheckCircle2 className="h-8 w-8 text-primary" />}
            {(status === 'invalid' || status === 'expired' || status === 'used') && <XCircle className="h-8 w-8 text-destructive" />}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && "Vérification de l'invitation..."}
            {(status === 'valid' || status === 'signup') && "Invitation Zoro Pilot"}
            {status === 'invalid' && "Invitation invalide"}
            {status === 'expired' && "Invitation expirée"}
            {status === 'used' && "Invitation déjà utilisée"}
          </CardTitle>
          
          <CardDescription>
            {status === 'valid' && `Vous avez été invité à rejoindre l'organisation ${inviteData?.organizations?.name}.`}
            {status === 'signup' && `Complétez votre inscription pour rejoindre ${inviteData?.organizations?.name}.`}
            {status === 'invalid' && "Ce lien d'invitation n'existe pas ou a été corrompu."}
            {status === 'expired' && "Cette invitation n'est plus valide car sa date d'expiration est dépassée."}
            {status === 'used' && "Cette invitation a déjà été consommée par un autre utilisateur."}
          </CardDescription>
        </CardHeader>

        {status === 'valid' && (
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-xl border border-border/40 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{inviteData.invited_email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{inviteData.organizations?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">Rôle : {inviteData.role_assigned || "Membre par défaut"}</span>
              </div>
            </div>

            <Button onClick={handleAccept} className="w-full py-6 text-lg font-semibold shadow-lg shadow-primary/20">
              Accepter l'invitation
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
              Zoro Pilot • Accès sécurisé
            </p>
          </CardContent>
        )}

        {status === 'signup' && (
          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={inviteData?.invited_email}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full py-6 text-lg font-semibold">
                {loading ? "Création du compte..." : "Créer mon compte"}
              </Button>
            </form>
          </CardContent>
        )}

        {(status === 'invalid' || status === 'expired' || status === 'used') && (
          <CardContent className="space-y-4">
            <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
              Retour à la connexion
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Contactez votre administrateur pour recevoir une nouvelle invitation.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
