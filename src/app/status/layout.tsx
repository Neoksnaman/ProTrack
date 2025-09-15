
'use client';

import Link from 'next/link';
import { FolderKanban, RefreshCw } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <FolderKanban className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold text-primary">ProTrack</span>
        </Link>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
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
