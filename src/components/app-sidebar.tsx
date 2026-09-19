import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  PackageIcon,
  UploadCloudIcon,
  FolderTreeIcon,
  UsersIcon,
  GemIcon,
  StoreIcon,
  CreditCardIcon,
  TruckIcon,
} from "lucide-react"

import { config } from "@/constants/config"
import { useAuth } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard",      url: "/",               icon: LayoutDashboardIcon },
  { title: "Products",       url: "/products",        icon: PackageIcon },
  { title: "Bulk Upload",    url: "/bulk-upload",     icon: UploadCloudIcon, superAdminOnly: true },
  { title: "Categories",     url: "/categories",      icon: FolderTreeIcon },
  { title: "Orders",         url: "/orders",          icon: ShoppingCartIcon },
  { title: "Customers",      url: "/users",           icon: UsersIcon },
  { title: "Store Settings", url: "/store-settings",  icon: StoreIcon },
  { title: "Payments",       url: "/payments",        icon: CreditCardIcon },
  { title: "Shipping",       url: "/shipping",        icon: TruckIcon },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === "super_admin"
  const visibleNavItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            <GemIcon className="size-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-semibold leading-tight text-sidebar-primary">
              {config.brand.name}
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Premium Jewellery
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const isActive =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="px-2 py-1 text-[10px] leading-relaxed text-sidebar-foreground/50">
          Developed by{' '}
          <a
            href="https://www.webtriggers.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-sidebar-foreground/80"
          >
            WebTriggers
          </a>
          <br />
          Managed by{' '}
          <a
            href="https://www.maittreyadigital.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-sidebar-foreground/80"
          >
            Maittreya Digital
          </a>
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
