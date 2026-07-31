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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Home, Settings, Menu, X, Plus, FileVideo, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, SignOutButton, useAuth } from "@clerk/nextjs"
import axios from "axios"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export function AppSidebar() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [recentConversions, setRecentConversions] = useState<conversionInterface[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<conversionInterface[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  async function searchConversions(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
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
        console.log("Failed to fetch conversions");
        return;
      }

      const conversionsData = conversionResponse.data.conversions as conversionInterface[];
      
      // Filter conversions based on search query
      const filtered = conversionsData.filter((conversion) =>
        conversion.Title.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filtered);

    } catch (error) {
      console.log("Error searching conversions: ", error);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    searchConversions(value);
  }

  function handleConversionClick(conversionId: string) {
    setIsSearchModalOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setIsMobileMenuOpen(false);
    window.location.href = `/${conversionId}`;
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
          "fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar border-r border-border transition-transform duration-300 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
            <Logo />
          </div>

          {/* New conversion button */}
          <div className="p-4">
            <Button className="w-full bg-primary hover:bg-white text-primary-foreground rounded-lg gap-2 transition-all duration-300" onClick={() => {
              // reload page
              window.location.href = "/";
            }}>
              <Plus className="h-4 w-4" />
              New Conversion
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 px-3 py-2">
            <Link
              href='/'
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                pathname === '/'
                  ? "bg-primary/15 text-primary shadow-sm shadow-primary/5"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
            <Button
              className={cn(
                "flex bg-transparent w-full h-10 items-center justify-start gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-white/5 hover:text-white cursor-pointer border-0",
              )}
              onClick={() => {
                setIsSearchModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Search className="h-5 w-5" />
              Search
            </Button>

            {/* Recent conversions */}
            <div className="pt-6 h-[48svh] overflow-y-auto scrollbar-slim">
              <p className="eyebrow px-4 text-muted-foreground mb-3">
                Recent Conversions
              </p>
              <div className="space-y-1">
                {recentConversions.map((conversion) => (
                  <Link
                    key={conversion.Id}
                    href={`/${conversion.Id}`}
                    className="flex items-start gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 hover:bg-white/5 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FileVideo className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors duration-250" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate group-hover:text-white transition-colors duration-250">{conversion.Title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(conversion.CreatedAt).toLocaleDateString("en-CA")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* User profile */}
          <div className="border-t border-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-white/5 text-left">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={user?.imageUrl} alt="User" />
                    <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.emailAddresses[0]?.emailAddress}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 text-white cursor-pointer">
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-400 border-0 hover:bg-red-500/10 hover:text-red-300 mt-1 rounded-lg cursor-pointer"
                  asChild
                >
                  <SignOutButton />
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Search Modal */}
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-popover border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-white">Search Conversions</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Search through your conversion history by title
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="pl-10 bg-input border-border text-white placeholder:text-muted-foreground rounded-lg focus-visible:ring-primary"
                autoFocus
              />
            </div>
            
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-sidebar-foreground/60">
                No conversions found matching "{searchQuery}"
              </div>
            )}
            
            {!isSearching && searchResults.length > 0 && (
              <div className="max-h-[400px] overflow-y-auto space-y-2 scrollbar-slim">
                {searchResults.map((conversion) => (
                  <button
                    key={conversion.Id}
                    onClick={() => handleConversionClick(conversion.Id)}
                    className="w-full flex items-start gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-sidebar-accent/50 border border-transparent hover:border-sidebar-border"
                  >
                    <FileVideo className="h-5 w-5 shrink-0 mt-0.5 text-sidebar-foreground/60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sidebar-foreground font-medium truncate">{conversion.Title}</p>
                      <p className="text-xs text-sidebar-foreground/60 mt-1">
                        Created on {new Date(conversion.CreatedAt).toLocaleDateString("en-US", { 
                          year: "numeric", 
                          month: "long", 
                          day: "numeric" 
                        })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-8 text-sidebar-foreground/60">
                Start typing to search your conversions
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
