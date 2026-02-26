'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Settings } from 'lucide-react';
import { DashboardHeader } from './components/dashboard-header';
import { DashboardNav } from './components/dashboard-nav';
import { LogoIcon } from '@/components/logo-icon';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Skeleton className="h-8 w-8 md:hidden" />
                <div className="flex-1" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </header>
            <div className="flex flex-1">
                <aside className="hidden md:block w-64 border-r p-4">
                    <div className="flex items-center gap-2 mb-8">
                        <Skeleton className="h-7 w-7" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                </aside>
                <main className="flex-1 p-4 lg:p-6">
                    <Skeleton className="h-full w-full" />
                </main>
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-headline text-lg font-bold text-primary-foreground"
          >
            <LogoIcon className="size-10 text-primary" />
            <span className="group-data-[collapsible=icon]:hidden">
              GemiWell
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <DashboardNav />
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard/settings" className="w-full">
                <SidebarMenuButton tooltip="Settings" className="w-full justify-start">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-svh flex flex-col bg-background">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
