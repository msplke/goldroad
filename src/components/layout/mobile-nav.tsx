"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "~/auth/client";
import { Icons } from "~/components/icons";
import { MaxWidthWrapper } from "~/components/max-width-wrapper";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import { marketingConfig } from "~/config/marketing";
import { cn } from "~/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const links = marketingConfig.mainNav;

  const { data: session } = authClient.useSession();

  // prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <MaxWidthWrapper>
      <Button
        variant="ghost"
        aria-expanded={open}
        aria-label="Toggle navigation menu"
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed top-2.5 right-2 z-50 rounded-full p-2 transition-colors duration-200 hover:bg-muted focus:outline-none active:bg-muted md:hidden",
          open && "hover:bg-muted active:bg-muted",
        )}
      >
        {open ? (
          <Icons.close className="size-5 text-muted-foreground" />
        ) : (
          <Icons.menu className="size-5 text-muted-foreground" />
        )}
      </Button>

      <nav
        aria-label="Mobile navigation"
        className={cn(
          "fixed inset-0 z-20 hidden w-full overflow-auto bg-background px-5 py-16 lg:hidden",
          open && "block",
        )}
      >
        <ul className="grid divide-y divide-muted">
          {links?.length
            ? links.map(({ title, href }) => (
                <li key={href} className="py-3">
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex w-full font-medium capitalize"
                  >
                    {title}
                  </Link>
                </li>
              ))
            : null}
        </ul>

        <div className="mt-8 flex items-center justify-between">
          {session ? (
            <Button asChild size="sm" onClick={() => setOpen(false)}>
              <Link href="/dashboard" className="font-medium capitalize">
                Dashboard
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-3 py-3">
              <Button
                asChild
                size="sm"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                <Link href="/login" className="font-medium capitalize">
                  Sign In
                </Link>
              </Button>

              <Button asChild size="sm" onClick={() => setOpen(false)}>
                <Link href="/login" className="font-medium capitalize">
                  Get Started
                </Link>
              </Button>
            </div>
          )}

          <ModeToggle />
        </div>
      </nav>
    </MaxWidthWrapper>
  );
}
