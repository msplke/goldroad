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
import { useOnboarding } from "~/hooks/use-onboarding";
import type { SidebarNavItem } from "~/types";

export function SidebarNav({
  sidebarLinks,
}: {
  sidebarLinks: SidebarNavItem[];
}) {
  const pathname = usePathname();
  const { isComplete } = useOnboarding();

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
                    const isActive = pathname === item.href;
                    const isDisabled = item.requiresOnboarding && !isComplete;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={
                            isDisabled
                              ? "Complete onboarding to access"
                              : item.title
                          }
                          className={
                            isDisabled
                              ? "cursor-not-allowed opacity-50 hover:bg-transparent"
                              : ""
                          }
                        >
                          {isDisabled ? (
                            <div className="flex w-full items-center gap-3 rounded-md font-medium text-sm">
                              <Icon className="size-4" />
                              <span>{item.title}</span>
                            </div>
                          ) : (
                            <Link
                              href={item.href}
                              className="flex w-full items-center gap-3 rounded-md font-medium text-sm hover:bg-muted"
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
