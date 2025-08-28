import type { Icons } from "~/components/icons";

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  icon?: keyof typeof Icons;
};

export type SidebarNavItem = {
  title: string;
  items: NavItem[];
  icon?: keyof typeof Icons;
};

export type MainNavItem = NavItem;

export type MarketingConfig = {
  mainNav: MainNavItem[];
};

export type Feature = {
  title: string;
  description: string;
  icon: keyof typeof Icons;
};

export type FooterItem = NavItem;
