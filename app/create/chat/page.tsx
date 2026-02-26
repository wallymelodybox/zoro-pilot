"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Users,
  Mail
} from "lucide-react"
import Link from "next/link"

export default function CreateChatPage() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card/80 backdrop-blur-xl rounded-xl shadow-lg border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-transparent">
          <div className="w-8" /> {/* Spacer */}
          <span className="font-semibold text-sm">Nouveau chat</span>
          <Link href="/create" className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors w-8 text-right">
            Fait
          </Link>
        </div>

        {/* Content */}
        <div className="bg-transparent">
           {/* Search */}
           <div className="p-3 border-b">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   className="pl-9 bg-muted/50 border-transparent focus:bg-background transition-colors h-9" 
                   placeholder="Recherche" 
                   autoFocus
                 />
              </div>
           </div>

           {/* Options List */}
           <div className="divide-y">
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left group">
                 <Users className="h-5 w-5 text-blue-500" />
                 <span className="text-sm text-blue-500 font-medium group-hover:text-blue-600">Create Group Chat</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left group">
                 <Mail className="h-5 w-5 text-blue-500" />
                 <span className="text-sm text-blue-500 font-medium group-hover:text-blue-600">Inviter un utilisateur par e-mail</span>
              </button>
           </div>
           
           {/* Empty Space filler */}
           <div className="h-32 bg-muted/5"></div>
        </div>
      </div>
    </div>
  )
}
