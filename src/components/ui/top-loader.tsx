
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTopLoaderStore } from '@/stores/use-top-loader-store';
import { cn } from '@/lib/utils';

export default function TopLoader() {
  const { isLoading, finish } = useTopLoaderStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When the path changes, finish the loader
    finish();
  }, [pathname, searchParams, finish]);

  // This is a failsafe in case the finish event is somehow missed
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        finish();
      }, 10000); // Auto-finish after 10 seconds
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isLoading, finish]);

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-1 z-50 w-full overflow-hidden transition-opacity duration-300',
        isLoading ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div className="absolute h-full w-full bg-primary/20" />
      <div className="relative h-full w-full">
         {isLoading && <div className="absolute h-full w-1/4 animate-loader-slide rounded-full bg-primary" />}
      </div>
    </div>
  );
}
