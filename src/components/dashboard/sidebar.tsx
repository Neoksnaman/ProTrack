
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { FolderKanban, Settings, LayoutDashboard, Shield, User, BarChart2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTopLoaderStore } from '@/stores/use-top-loader-store';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { start } = useTopLoaderStore();
  const { close } = useSidebar();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname !== href) {
        start();
    }
    close();
  }

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2" onClick={(e) => handleLinkClick(e, '/')}>
          <FolderKanban className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
            ProTrack
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Dashboard">
              <Link href="/" onClick={(e) => handleLinkClick(e, '/')}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/stats'} tooltip="My Stats">
              <Link href="/stats" onClick={(e) => handleLinkClick(e, '/stats')}>
                <BarChart2 />
                <span>My Stats</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user?.role === 'Admin' && (
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin'} tooltip="Admin">
                <Link href="/admin" onClick={(e) => handleLinkClick(e, '/admin')}>
                  <Shield />
                  <span>Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/profile'} tooltip="Profile">
              <Link href="/profile" onClick={(e) => handleLinkClick(e, '/profile')}>
                <User />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
