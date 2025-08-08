
'use client';

import { useState } from 'react';
import { generateProjectSummary, type GenerateProjectSummaryOutput } from '@/ai/flows/project-summary';
import { analyzeProjectRisks, type AnalyzeProjectRisksOutput } from '@/ai/flows/risk-analysis';
import { provideActionableSuggestions, type ActionableSuggestionsOutput } from '@/ai/flows/actionable-suggestions';
import type { Project, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Sparkles, AlertTriangle, ListChecks, FileText } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

type AnalysisType = 'summary' | 'risk' | 'suggestions';

export default function AISummary({ project, tasks }: { project: Project, tasks: Task[] }) {
  const [summary, setSummary] = useState<GenerateProjectSummaryOutput | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<AnalyzeProjectRisksOutput | null>(null);
  const [suggestions, setSuggestions] = useState<ActionableSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (type: AnalysisType) => {
    setIsLoading(type);
    setError(null);

    // Reset previous results for a clean slate
    if (type === 'summary') setSummary(null);
    if (type === 'risk') setRiskAnalysis(null);
    if (type === 'suggestions') setSuggestions(null);
    
    const commonInput = {
      projectName: project.name,
      description: project.description,
      teamMembers: project.teamMembers.map(m => m.name),
      startDate: project.startDate,
      deadline: project.deadline,
      currentStatus: project.status,
    };
    
    try {
      if (type === 'summary') {
        const result = await generateProjectSummary({
          ...commonInput,
          teamMembers: `${project.teamLeader} (Leader), ${project.teamMembers.map(m => m.name).join(', ')}`,
          tasks: JSON.stringify(tasks.map(t => ({name: t.name, description: t.description, status: t.status}))),
        });
        setSummary(result);
      } else if (type === 'risk') {
         const result = await analyzeProjectRisks({
           ...commonInput,
           description: project.description
         });
         setRiskAnalysis(result);
      } else if (type === 'suggestions') {
         const result = await provideActionableSuggestions({
           ...commonInput,
           projectDescription: project.description
         });
         setSuggestions(result);
      }
    } catch (err) {
      console.error(`Error generating ${type}:`, err);
      setError(`Failed to generate AI ${type}. Please try again.`);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          <CardTitle>AI Project Analysis</CardTitle>
        </div>
        <CardDescription>Get AI-powered insights for this project.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
            <Button onClick={() => handleGenerate('summary')} disabled={!!isLoading} size="sm">
                <FileText className="mr-2"/>
                {isLoading === 'summary' ? 'Generating...' : 'Project Summary'}
            </Button>
            <Button onClick={() => handleGenerate('risk')} disabled={!!isLoading} size="sm">
                <AlertTriangle className="mr-2"/>
                {isLoading === 'risk' ? 'Analyzing...' : 'Risk Analysis'}
            </Button>
            <Button onClick={() => handleGenerate('suggestions')} disabled={!!isLoading} size="sm">
                <ListChecks className="mr-2"/>
                {isLoading === 'suggestions' ? 'Generating...' : 'Actionable Suggestions'}
            </Button>
        </div>

        {isLoading && <LoadingSkeleton />}
        
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        
        <Accordion type="single" collapsible className="w-full">
            {summary && (
              <AccordionItem value="summary">
                  <AccordionTrigger>
                      <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Executive Summary</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                      <p>{summary.executiveSummary}</p>
                      <h4 className="font-semibold text-foreground">Risk Assessment</h4>
                      <p>{summary.riskAssessment}</p>
                      <h4 className="font-semibold text-foreground">Actionable Suggestions</h4>
                      <p>{summary.actionableSuggestions}</p>
                  </AccordionContent>
              </AccordionItem>
            )}
            {riskAnalysis && (
              <AccordionItem value="risk">
                  <AccordionTrigger>
                      <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Risk Analysis Results</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                      <h4 className="font-semibold text-foreground">Executive Summary</h4>
                      <p>{riskAnalysis.executiveSummary}</p>
                      <h4 className="font-semibold text-foreground">Identified Risks</h4>
                      <ul className="list-disc space-y-2 pl-5">
                        {riskAnalysis.risks.map((r, i) => (
                            <li key={i}>
                                <span className="font-medium text-foreground">[{r.severity}]</span> {r.risk}
                                <p className="pl-2 text-xs italic">Mitigation: {r.mitigationStrategy}</p>
                            </li>
                        ))}
                      </ul>
                       <h4 className="font-semibold text-foreground">Potential Bottlenecks</h4>
                       <ul className="list-disc space-y-2 pl-5">
                        {riskAnalysis.bottlenecks.map((b, i) => (
                            <li key={i}>
                                {b.bottleneck}
                                <p className="pl-2 text-xs italic">Solution: {b.solution}</p>
                            </li>
                        ))}
                      </ul>
                  </AccordionContent>
              </AccordionItem>
            )}
            {suggestions && (
              <AccordionItem value="suggestions">
                  <AccordionTrigger>
                      <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4" />
                          <span>Suggestions Results</span>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-4">
                      <h4 className="font-semibold text-foreground">Executive Summary</h4>
                      <p>{suggestions.executiveSummary}</p>
                      <h4 className="font-semibold text-foreground">Actionable Suggestions</h4>
                       <ul className="list-disc space-y-2 pl-5">
                        {suggestions.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                      <h4 className="font-semibold text-foreground">Risk Assessment</h4>
                      <p>{suggestions.riskAssessment}</p>
                      <h4 className="font-semibold text-foreground">Bottleneck Analysis</h4>
                      <p>{suggestions.bottleneckAnalysis}</p>
                  </AccordionContent>
              </AccordionItem>
            )}
        </Accordion>
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
