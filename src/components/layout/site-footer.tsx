import Link from "next/link";

import { Icons } from "~/components/icons";
import { MaxWidthWrapper } from "~/components/max-width-wrapper";
import { Button } from "~/components/ui/button";
import { footerItems } from "~/config/marketing";
import { cn } from "~/lib/utils";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("bg-background border-t", className)}>
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-between gap-2 py-4 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-2">
            <Icons.logo />
            <p className="text-sm leading-loose">
              © {new Date().getFullYear()} Kejaniverse. All rights reserved.
            </p>
          </div>

          <div className="text-primary flex gap-2 text-sm">
            {footerItems.map((item, index) => (
              <Link
                key={`${index}-${item.title}`}
                href={item.disabled ? "#" : item.href}
              >
                <Button variant="link">{item.title}</Button>
              </Link>
            ))}
          </div>
        </div>
      </MaxWidthWrapper>
    </footer>
  );
}
