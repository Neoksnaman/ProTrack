
'use client';

import { Suspense } from 'react';
import StatusPageContent from './StatusPageContent';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatusPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StatusPageContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-8 w-1/2" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

    