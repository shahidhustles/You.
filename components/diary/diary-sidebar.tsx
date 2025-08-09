"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Compass, Search, BookOpen } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useClerk } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label}>
        <Link href={href} className="flex items-center gap-2 mt-2">
          <span className="text-base leading-none">{icon}</span>
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export interface DiarySidebarProps {
  firstName?: string | null;
}

export const DiarySidebar: React.FC<DiarySidebarProps> = ({
  firstName = "firstName",
}) => {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const displayName = `${user?.firstName} ${user?.lastName}` || firstName || "";
  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60"
    >
      <SidebarHeader className="px-2 pb-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            hi,{" "}
            {isLoaded ? (
              <span className="text-zinc-100">{displayName}</span>
            ) : (
              <Skeleton className="inline-block h-3 w-12 align-middle" />
            )}
          </span>
          <SidebarTrigger className="md:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="py-4">
              <NavItem
                href="/diary/today"
                label="Today"
                icon={<CalendarDays className="size-4" />}
              />
              <NavItem
                href="/diary/space"
                label="Space"
                icon={<BookOpen className="size-4" />}
              />
              <NavItem
                href="/diary/journey"
                label="Journey"
                icon={<Compass className="size-4" />}
              />
              <NavItem
                href="/diary/search"
                label="Search"
                icon={<Search className="size-4" />}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="m-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800/60 transition-colors">
                {isLoaded ? (
                  <>
                    {user?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.imageUrl}
                        alt={displayName}
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-zinc-700" />
                    )}
                    <span className="truncate text-zinc-300">
                      {displayName}
                    </span>
                  </>
                ) : (
                  <>
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
