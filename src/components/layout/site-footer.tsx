import Link from "next/link";

import { Icons } from "~/components/icons";
import { MaxWidthWrapper } from "~/components/max-width-wrapper";
import { Button } from "~/components/ui/button";
import { footerItems } from "~/config/marketing";
import { siteConfig } from "~/config/site";
import { cn } from "~/lib/utils";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("bg-background border-t", className)}>
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-between gap-2 py-4 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-2">
            <Icons.logo />
            <p className="text-sm leading-loose">
              © {new Date().getFullYear()} {siteConfig.name}. All rights
              reserved.
            </p>
          </div>

          <div className="text-primary flex gap-2 text-sm">
            {footerItems.map((item) =>
              item.disabled ? (
                <Button key={item.title} variant="link" disabled>
                  {item.title}
                </Button>
              ) : (
                <Button key={item.title} variant="link" asChild>
                  <Link href={item.href}>{item.title}</Link>
                </Button>
              ),
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </footer>
  );
}
