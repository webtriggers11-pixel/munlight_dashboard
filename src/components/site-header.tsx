import { useNavigate } from "react-router-dom"
import { BellIcon, SearchIcon } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD"
  )
}

export function SiteHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-card px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="relative w-full max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="h-9 bg-muted pl-8"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ModeToggle />
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <BellIcon />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
        </Button>
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-6" />
        {user && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              Logout
            </Button>
            <Avatar className="size-8 border">
              <AvatarFallback className="text-xs">
                {initials(user.full_name)}
              </AvatarFallback>
            </Avatar>
          </>
        )}
      </div>
    </header>
  )
}
