import type { Feature, FooterItem, MarketingConfig } from "~/types";

export const marketingConfig: MarketingConfig = {
  mainNav: [
    {
      title: "Features",
      href: "#features",
    },
    {
      title: "How It Works",
      href: "#how-it-works",
    },
    {
      title: "Pricing",
      href: "#pricing",
    },
    // {
    //   title: "Testimonials",
    //   href: "#testimonials",
    // },
  ],
};

export const features: Feature[] = [
  {
    title: "Recurring & One-Time Support",
    description:
      "Accept monthly subscriptions, annual plans, or one-time contributions from your audience and supporters.",
    icon: "payments",
  },
  {
    title: "Optional Mailing List Sync",
    description:
      'Automatically sync paying subscribers to Kit for separate "paid" content. Or skip it and keep using Substack or your existing writing platform.',
    icon: "users",
  },
  {
    title: "Payouts to Your Bank",
    description: "Get paid directly to your bank account (1-2 working days).",
    icon: "zap",
  },
];

export const footerItems: FooterItem[] = [
  {
    title: "Contact",
    href: "#",
    disabled: true,
  },
  {
    title: "Terms",
    href: "#",
    disabled: true,
  },
  {
    title: "Privacy",
    href: "#",
    disabled: true,
  },
];
