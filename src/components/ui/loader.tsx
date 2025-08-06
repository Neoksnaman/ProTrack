
'use client';

import { FolderKanban } from 'lucide-react';

export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-2">
            <FolderKanban className="h-10 w-10 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold text-primary">ProTrack</h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
             <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
             <span>Fetching data...</span>
        </div>
      </div>
    </div>
  );
}
