
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Printer } from 'lucide-react';
import ProjectList from '@/components/dashboard/project-list';
import { useTopLoaderStore } from '@/stores/use-top-loader-store';
import { useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DashboardPage() {
  const { start, finish } = useTopLoaderStore();

  useEffect(() => {
    // Ensure the loader is finished when the dashboard is loaded.
    finish();
  }, [finish]);

  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Projects Dashboard</h1>
        <div className="flex gap-2">
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                   <span className="sr-only">Print</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button asChild>
            <Link href="/projects/new" onClick={start}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>
      <ProjectList />
    </div>
  );
}
