"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumnIcon,
  EllipsisVerticalIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PanelLeftCloseIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { UserAvatar } from "@/components/auth/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

const navigation = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Bills", href: "/bills", icon: FileTextIcon },
  { title: "Clients", href: "/clients", icon: UsersIcon },
  { title: "Reports", href: "/reports", icon: ChartColumnIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

type SidebarUser = {
  name: string;
  email: string;
  image?: string | null;
};

export function AppSidebar({ user }: { user?: SidebarUser }) {
  const { isMobile, openMobile, setOpenMobile, state, toggleSidebar } = useSidebar();
  const [signingOut, setSigningOut] = useState(false);
  const sidebarOpen = isMobile ? openMobile : state === "expanded";

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    // A full page load, not a client navigation: Next.js keeps visited pages alive in
    // the background, and none of this user's pages or state should survive sign-out.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload is the point
    window.location.assign("/sign-in");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              size="lg"
              tooltip={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
              onClick={toggleSidebar}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ReceiptTextIcon />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-heading text-base font-semibold tracking-tight">
                  Billraklo
                </span>
                <span className="truncate text-xs text-muted-foreground">Bill collection</span>
              </div>
              <PanelLeftCloseIcon className="ml-auto shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <Suspense fallback={<SidebarLinks onNavigate={() => setOpenMobile(false)} />}>
              <ActiveSidebarLinks onNavigate={() => setOpenMobile(false)} />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<SidebarMenuButton size="lg" className="aria-expanded:bg-sidebar-accent" />}
                >
                  <UserAvatar user={user} />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <EllipsisVerticalIcon className="ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <UserAvatar user={user} />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium">{user.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={signingOut}
                    onClick={handleSignOut}
                  >
                    {signingOut ? <Spinner /> : <LogOutIcon />}
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex h-12 items-center gap-2 px-2">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="grid flex-1 gap-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function ActiveSidebarLinks({ onNavigate }: { onNavigate: () => void }) {
  return <SidebarLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

function SidebarLinks({ pathname, onNavigate }: { pathname?: string; onNavigate: () => void }) {
  return (
    <SidebarMenu>
      {navigation.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            isActive={pathname === item.href || pathname?.startsWith(`${item.href}/`)}
            tooltip={item.title}
            render={<Link href={item.href} />}
            onClick={onNavigate}
          >
            <item.icon />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppMobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-14 items-center gap-1 border-b px-3 md:hidden">
      <SidebarTrigger />
      <button
        type="button"
        onClick={toggleSidebar}
        className="font-heading text-base font-semibold tracking-tight"
      >
        Billraklo
      </button>
    </header>
  );
}
