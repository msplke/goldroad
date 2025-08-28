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
    {
      title: "Testimonials",
      href: "#testimonials",
    },
  ],
};

export const features: Feature[] = [
  {
    title: "Local Payment Processing",
    description: "Accept payments via Paystack from customers across Africa.",
    icon: "payments",
  },
  {
    title: "Kit Auto-Sync",
    description:
      "Paying subscribers automatically added to your mailing list on Kit.",
    icon: "users",
  },
  {
    title: "Instant Bank Payouts",
    description: "Get paid directly to your local bank account.",
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
