
import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import { AuthProvider } from '@/hooks/use-auth';
import { DataProvider } from '@/hooks/use-data';
import TopLoader from '@/components/ui/top-loader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <TopLoader />
        <SidebarProvider>
          <Sidebar className="print:hidden">
            <AppSidebar />
          </Sidebar>
          <SidebarInset>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-4 md:p-6 lg:p-8 print:p-0 print:bg-white">
                {children}
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </DataProvider>
    </AuthProvider>
  );
}
