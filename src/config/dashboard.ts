import type { SidebarNavItem } from "~/types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        title: "Overview",
        href: `/dashboard`,
        icon: "dashboard",
      },
    ],
  },
  {
    title: "OPTIONS",
    items: [
      {
        title: "Settings",
        href: `/settings`,
        icon: "settings",
        disabled: true,
      },
      {
        title: "Homepage",
        href: "/",
        icon: "home",
      },
    ],
  },
];
