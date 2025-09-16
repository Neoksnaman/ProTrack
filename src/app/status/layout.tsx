
'use client';

import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import { FolderKanban, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { eventBus } from '@/lib/events';


export default function StatusLayout({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleRefreshStart = () => setIsRefreshing(true);
    const handleRefreshEnd = () => setIsRefreshing(false);

    eventBus.on('refreshPublicPageStart', handleRefreshStart);
    eventBus.on('refreshPublicPageEnd', handleRefreshEnd);

    // Stop refreshing if the user navigates away
    setIsRefreshing(false);

    return () => {
      eventBus.off('refreshPublicPageStart', handleRefreshStart);
      eventBus.off('refreshPublicPageEnd', handleRefreshEnd);
    };
  }, [pathname, searchParams]);


  const handleRefresh = () => {
    eventBus.dispatch('refreshPublicPage');
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <FolderKanban className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-primary">ProTrack</span>
        </Link>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            <span className="sr-only">Refresh</span>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            {children}
        </div>
      </main>
      <Toaster />
    </>
  );
}
