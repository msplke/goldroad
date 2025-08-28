import { getBaseUrl } from "~/lib/utils";

type SiteConfig = {
  name: string;
  url: string;
  description: string;
  authors: { name: string; url: string }[];
  keywords: string[];
  ogImage: string;
};

export const siteConfig: SiteConfig = {
  name: "Goldroad",
  url: getBaseUrl(),
  description:
    "Accept recurring payments locally with Paystack, automatically sync paying subscribers into your ConvertKit, get payouts to your bank.",
  authors: [
    { name: "Peter Kibuchi", url: "https://github.com/peterkibuchi" },
    { name: "Glen Ochieng", url: "https://github.com/Mirror83" },
  ],
  keywords: [],
  ogImage: `${getBaseUrl()}/og.png`,
};
