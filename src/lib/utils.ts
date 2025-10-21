import { type ClassValue, clsx } from "clsx";
import type { Metadata } from "next";
import { twMerge } from "tailwind-merge";

import { siteConfig } from "~/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  url = siteConfig.url,
  type = "website",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    authors: siteConfig.authors,
    keywords: siteConfig.keywords,
    icons: {
      apple: "/apple-touch-icon.png",
      icon: "/android-chrome-192x192.png",
      shortcut: "/favicon.ico",
    },
    manifest: `${url}/manifest.json`,
    metadataBase: new URL(url),
    openGraph: {
      title,
      description,
      siteName: siteConfig.name,
      url,
      type,
      locale: "en-US",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      // creator: "@example",
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin; // Browser should use relative url
  // SSR should use Vercel url
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`; // Dev SSR should use localhost
}

export function generateSlugFromName(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Handle edge case where name results in empty slug or very short slug
  if (slug.length === 0) {
    slug = "publication";
  } else if (slug.length < 3) {
    slug = `publication-${slug}`;
  }

  return slug;
}

export function objectIsEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

const PAYSTACK_SUBUNIT_CONVERSION_FACTOR = 100;

export function fromSubunitsToBaseUnits(
  currencyInSubunits: number,
  conversionFactor: number = PAYSTACK_SUBUNIT_CONVERSION_FACTOR,
): number {
  return currencyInSubunits / conversionFactor;
}

export function fromBaseUnitsToSubunits(
  currencyInSubunits: number,
  conversionFactor: number = PAYSTACK_SUBUNIT_CONVERSION_FACTOR,
) {
  return currencyInSubunits * conversionFactor;
}
