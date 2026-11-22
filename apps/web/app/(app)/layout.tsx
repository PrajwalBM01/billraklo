import { Suspense } from "react";
import { AppMobileHeader, AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        {/* The session is read per request, so the user menu streams in behind a boundary. */}
        <Suspense fallback={<AppSidebar />}>
          <SidebarWithUser />
        </Suspense>
        <SidebarInset>
          <AppMobileHeader />
          <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-8">
            {children}
          </main>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}

async function SidebarWithUser() {
  const session = await getSession();
  if (!session) return <AppSidebar />;

  const { user } = session;
  return <AppSidebar user={{ name: user.name, email: user.email, image: user.image }} />;
}
