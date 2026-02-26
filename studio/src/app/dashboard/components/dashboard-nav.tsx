'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Bot,
  FileText,
  HeartPulse,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/chat', label: 'AI Health Chat', icon: Bot },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/tracking', label: 'Tracking', icon: HeartPulse },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="w-full">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href} className="w-full">
          <Link href={item.href} className="w-full">
            <SidebarMenuButton
              className="w-full justify-start"
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
