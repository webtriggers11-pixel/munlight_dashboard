import { Outlet } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function DashboardLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "240px",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      {/* min-w-0: SidebarInset carries `w-full`, which also becomes its automatic
          minimum size as a flex item. Without this it can never shrink below the
          full wrapper width, so any page wider than the space left by the sidebar
          (a wide table, for example) pushes the whole document 240px wide instead
          of scrolling inside its own container. */}
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <main className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
