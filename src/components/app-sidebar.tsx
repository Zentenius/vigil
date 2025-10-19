"use client"

import * as React from "react"
import {
  Shield,
  BarChart3,
  History,
  Settings,
  HelpCircle,
  Eye,
  Lightbulb,
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar"
import { InsightModal } from "./insight-modal"
import { useGuestMode } from "~/hooks/use-guest-mode"
import { SignIn } from "~/components/auth/sign-in"

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
  const { isMobile } = useSidebar()
  const [insightOpen, setInsightOpen] = React.useState(false)
  const navData = getNavData(session)
  const { isGuest, setGuest } = useGuestMode()

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Eye className="h-6 w-6 text-green-500" />
          <span className="font-semibold text-lg">Vigil</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        {/* If guest mode, show a sign-in prompt */}
        {isGuest && !session && (
          <div className="px-4 mt-4">
            <div className="text-xs text-muted-foreground mb-2">You are browsing as a guest</div>
            <SignIn />
            <div className="text-xs text-muted-foreground mt-2">
              <button className="underline" onClick={() => setGuest(false)}>Exit guest mode</button>
            </div>
          </div>
        )}
        
        {/* Insight Section */}
        <SidebarGroup className="mt-auto pt-8">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setInsightOpen(true)} className="flex items-center gap-2 cursor-pointer bg-gray-900/50 hover:bg-gray-900 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium">Insight</span>
                <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">Safe</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <InsightModal open={insightOpen} onOpenChange={setInsightOpen} />
    </>
  )
}
