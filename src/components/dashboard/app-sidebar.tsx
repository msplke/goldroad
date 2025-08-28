"use client";

import { NavUser } from "~/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "~/components/ui/sidebar";
import { sidebarLinks } from "~/config/dashboard";
import { SidebarNav } from "./sidebar-nav";

type AppSidebarProps = {
  user: {
    name: string;
    email: string;
  };
};

export function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarNav sidebarLinks={sidebarLinks} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
