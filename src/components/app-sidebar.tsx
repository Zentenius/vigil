"use client"

import * as React from "react"
import {
  Shield,
  BarChart3,
  History,
  Settings,
  HelpCircle,
  Eye,
  User,
} from "lucide-react"
import { useSession } from "next-auth/react"

import { NavMain } from "~/components/nav-main"
import { NavUser } from "~/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar"

// Navigation data matching your design
const getNavData = (session: any) => ({
  user: {
    name: session?.user?.name || "Community Watch User",
    email: session?.user?.email || "user@example.com",
    avatar: session?.user?.image || "/default-avatar.png",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Shield,
      isActive: true,
    },
    {
      title: "Reports History",
      url: "/dashboard/reports",
      icon: History,
    },
    {
      title: "Statistics & Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      title: "Settings & Profile",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Help & About",
      url: "/dashboard/help",
      icon: HelpCircle,
    },
  ],
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const navData = getNavData(session)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Eye className="h-6 w-6 text-green-500" />
          <span className="font-semibold text-lg"></span>
        </div>
      </SidebarHeader>
      <SidebarContent>
          <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
