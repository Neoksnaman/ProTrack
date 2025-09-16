
'use client';

import { Suspense } from 'react';
import StatusPageContent from './StatusPageContent';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

export default function StatusPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <Suspense fallback={<PageSkeleton />}>
      <StatusPageContent token={token} />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-3/4" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
