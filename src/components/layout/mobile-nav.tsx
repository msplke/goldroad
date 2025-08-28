"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icons } from "~/components/icons";
import { MaxWidthWrapper } from "~/components/max-width-wrapper";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import { marketingConfig } from "~/config/marketing";
import { cn } from "~/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const links = marketingConfig.mainNav;

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
          "hover:bg-muted active:bg-muted fixed top-2.5 right-2 z-50 rounded-full p-2 transition-colors duration-200 focus:outline-none md:hidden",
          open && "hover:bg-muted active:bg-muted",
        )}
      >
        {open ? (
          <Icons.close className="text-muted-foreground size-5" />
        ) : (
          <Icons.menu className="text-muted-foreground size-5" />
        )}
      </Button>

      <nav
        aria-label="Mobile navigation"
        className={cn(
          "bg-background fixed inset-0 z-20 hidden w-full overflow-auto px-5 py-16 lg:hidden",
          open && "block",
        )}
      >
        <ul className="divide-muted grid divide-y">
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
          <div className="flex items-center gap-3 py-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Button>

            <Button size="sm" onClick={() => setOpen(false)}>
              Get Started
            </Button>
          </div>

          <Link
            href="/properties"
            onClick={() => setOpen(false)}
            className="flex w-full font-medium capitalize"
          >
            <Button size="sm">Properties</Button>
          </Link>

          <ModeToggle />
        </div>
      </nav>
    </MaxWidthWrapper>
  );
}
