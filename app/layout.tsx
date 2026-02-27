import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AppShell } from "@/components/app-shell"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeVariantProvider } from "@/components/theme/variant-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ZORO PILOT - La strategie rencontre l'execution",
  description:
    "Fusion de la gestion OKR/Strategie et de la gestion Projets/Taches. Connectez votre vision au travail quotidien.",
}

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <ThemeVariantProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
            <Analytics />
          </ThemeVariantProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}