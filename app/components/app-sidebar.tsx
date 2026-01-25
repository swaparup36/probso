"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Settings, Menu, X, Plus, FileVideo, Search, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, SignOutButton, useAuth } from "@clerk/nextjs"
import axios from "axios"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: "History",
    href: "/history",
    icon: <Search className="h-5 w-5" />,
  },
]

export function AppSidebar() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [recentConversions, setRecentConversions] = useState<conversionInterface[]>([]);

  async function fetchRecentConversions() {
    try {
      if (!user) {
        console.log("No user found");
        return;
      }

      const token = await getToken();

      if (!token) {
        console.log("No token found");
        return;
      }

      const conversionResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/conversions/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (conversionResponse.status !== 200) {
        console.log("Failed to fetch recent conversions");
        return;
      }

      const conversionsData = conversionResponse.data.conversions as conversionInterface[];
      console.log("Recent Conversions: ", conversionsData);
      setRecentConversions(conversionsData);

    } catch (error) {
      console.log("Error fetching recent conversion: ", error)
    }
  }

  useEffect(() => {
    fetchRecentConversions();
  }, [user]);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-[#12131f] border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
            <Logo />
          </div>

          {/* New conversion button */}
          <div className="p-4">
            <Button asChild className="w-full bg-[#7c7dda] hover:bg-[#6a70de] text-white rounded-full gap-2">
              <Link href="/">
                <Plus className="h-4 w-4" />
                New Conversion
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-2">
            <Link
              href='/'
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === '/'
                  ? "bg-sidebar-accent text-sidebar-accent-foreground rounded-full"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:rounded-full",
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home />
              Home
            </Link>
            <Button
              className={cn(
                "flex bg-transparent w-full h-12 items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:rounded-full",
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Search />
              Search
            </Button>

            {/* Recent conversions */}
            <div className="pt-6 h-[50svh] overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">
                Recent
              </p>
              <div className="space-y-1">
                {recentConversions.map((conversion) => (
                  <Link
                    key={conversion.Id}
                    href={`/${conversion.Id}`}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FileVideo className="h-4 w-4 shrink-0 mt-0.5 text-sidebar-foreground/60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sidebar-foreground font-medium truncate">{conversion.Title}</p>
                      <p className="text-xs text-sidebar-foreground/60">{new Date(conversion.CreatedAt).toLocaleDateString("en-CA")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* User profile */}
          <div className="border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.imageUrl} alt="User" />
                    <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-sidebar-foreground/60">{user?.emailAddresses[0]?.emailAddress.slice(0, 20).concat("...")}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
                  asChild
                >
                  <SignOutButton />
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  )
}
