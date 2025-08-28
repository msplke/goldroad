"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icons } from "~/components/icons";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import type { SidebarNavItem } from "~/types";

export function SidebarNav({
  sidebarLinks,
}: {
  sidebarLinks: SidebarNavItem[];
}) {
  const path = usePathname();

  return (
    <nav>
      {sidebarLinks.map((section) => {
        return (
          <section key={section.title} className="flex flex-col gap-0.5">
            <SidebarGroup>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>

              <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                  {section.items.map((item) => {
                    const Icon = Icons[item.icon ?? "arrowRight"];

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          tooltip={item.title}
                          disabled={item.disabled}
                          className={cn(
                            path === item.href
                              ? "bg-muted"
                              : "text-muted-foreground hover:text-accent-foreground",
                          )}
                        >
                          {item.disabled ? (
                            <div className="flex flex-1 cursor-not-allowed items-center gap-3 rounded-md text-sm font-medium opacity-80">
                              <Icon className="size-4" />
                              <span>{item.title}</span>
                            </div>
                          ) : (
                            <Link
                              href={item.href}
                              className={cn(
                                "hover:bg-muted flex flex-1 items-center gap-3 rounded-md text-sm font-medium",
                              )}
                            >
                              <Icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </section>
        );
      })}
    </nav>
  );
}
