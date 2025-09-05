"use client";

import { SidebarHead } from "~/components/dashboard/sidebar-head";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { sidebarLinks } from "~/config/dashboard";
import { SidebarNav } from "./sidebar-nav";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarHead />
      </SidebarHeader>

      <SidebarContent>
        <SidebarNav sidebarLinks={sidebarLinks} />
      </SidebarContent>
    </Sidebar>
  );
}
