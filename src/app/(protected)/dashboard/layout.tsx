import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "~/auth/server";
import { AppSidebar } from "~/components/dashboard/app-sidebar";
import { UserDropdown } from "~/components/dashboard/user-dropdown";
import { MaxWidthWrapper } from "~/components/max-width-wrapper";
import { ModeToggle } from "~/components/mode-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { OnboardingProvider } from "~/hooks/use-onboarding";
import { api } from "~/trpc/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  try {
    const creator = await api.creator.get();
    if (!creator) {
      await api.creator.create();
    }
  } catch (error) {
    console.log(error);
    return <div>Something went wrong. Try to refresh.</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            {/* Header */}
            <header className="sticky top-0 z-50 flex h-14 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:h-[60px]">
              <MaxWidthWrapper className="flex max-w-7xl items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                </div>

                <div className="flex items-center gap-2">
                  <ModeToggle />
                  <UserDropdown />
                </div>
              </MaxWidthWrapper>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6">
              <MaxWidthWrapper className="flex h-full max-w-7xl flex-col gap-4 lg:gap-6">
                {children}
              </MaxWidthWrapper>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </OnboardingProvider>
    </Suspense>
  );
}
