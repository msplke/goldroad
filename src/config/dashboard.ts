import type { SidebarNavItem } from "~/types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        title: "Overview",
        href: `/dashboard`,
        icon: "dashboard",
        requiresOnboarding: false,
      },
      // {
      //   title: "Subscribers",
      //   href: "/dashboard/subscribers",
      //   icon: "users",
      //   requiresOnboarding: true,
      // },
      {
        title: "Publication",
        href: "/dashboard/publication",
        icon: "library",
        requiresOnboarding: true,
      },
    ],
  },
  {
    title: "OPTIONS",
    items: [
      {
        title: "Settings",
        href: `/dashboard/settings`,
        icon: "settings",
        requiresOnboarding: false,
      },
      {
        title: "Homepage",
        href: "/",
        icon: "home",
        requiresOnboarding: false,
      },
      {
        title: "Contact Support",
        href: "mailto:kibuchi.chad@gmail.com",
        icon: "help",
        requiresOnboarding: false,
      },
    ],
  },
];
