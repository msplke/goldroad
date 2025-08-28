import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/auth/server";
import { AppSidebar } from "~/components/dashboard/app-sidebar";
import { MaxWidthWrapper } from "~/components/max-width-wrapper";
import { ModeToggle } from "~/components/mode-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";

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

  const user = session.user as { name: string; email: string };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-50 flex h-14 lg:h-[60px]">
          <MaxWidthWrapper className="flex max-w-7xl items-center gap-x-3">
            <div className="w-full flex-1">
              <SidebarTrigger />
            </div>

            <ModeToggle />
          </MaxWidthWrapper>
        </header>

        <main className="flex-1">
          <MaxWidthWrapper className="flex h-full max-w-7xl flex-col gap-4 lg:gap-6">
            {children}
          </MaxWidthWrapper>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
