
'use client';

import { useState } from 'react';
import { generateProjectSummary, type GenerateProjectSummaryOutput } from '@/ai/flows/project-summary';
import type { Project, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Sparkles, AlertTriangle, ListChecks } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface AISummaryProps {
  project: Project;
  tasks: Task[];
}

export default function AISummary({ project, tasks }: AISummaryProps) {
  const [summary, setSummary] = useState<GenerateProjectSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const result = await generateProjectSummary({
        projectName: project.name,
        description: project.description,
        teamMembers: `${project.teamLeader} (Leader), ${project.teamMembers.join(', ')}`,
        startDate: project.startDate,
        deadline: project.deadline,
        currentStatus: project.status,
        tasks: JSON.stringify(tasks.map(t => ({name: t.name, description: t.description, status: t.status}))),
      });
      setSummary(result);
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Failed to generate AI summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          <CardTitle>AI Project Analysis</CardTitle>
        </div>
        <CardDescription>Get an AI-powered summary, risk assessment, and suggestions for this project.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full">
          {isLoading ? 'Generating...' : 'Generate AI Summary'}
        </Button>

        {isLoading && <LoadingSkeleton />}
        
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        
        {summary && (
          <div className="space-y-4 pt-4">
            <Accordion type="single" collapsible defaultValue="summary" className="w-full">
              <AccordionItem value="summary">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Executive Summary</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{summary.executiveSummary}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="risk">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Risk Assessment</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{summary.riskAssessment}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="suggestions">
                <AccordionTrigger>
                   <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    <span>Actionable Suggestions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{summary.actionableSuggestions}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
