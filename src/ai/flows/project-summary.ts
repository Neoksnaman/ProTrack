// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview Provides an AI-powered executive summary of a project, including risk detection,
 * bottleneck identification, and actionable suggestions.
 *
 * - generateProjectSummary - Generates the project summary.
 * - GenerateProjectSummaryInput - Input type for the generateProjectSummary function.
 * - GenerateProjectSummaryOutput - Return type for the generateProjectSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectSummaryInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  description: z.string().describe('A detailed description of the project.'),
  teamMembers: z.string().describe('A comma-separated list of team members.'),
  startDate: z.string().describe('The start date of the project (YYYY-MM-DD).'),
  deadline: z.string().describe('The project deadline (YYYY-MM-DD).'),
  currentStatus: z.string().describe('The current status of the project (e.g., Planning, In Progress, Blocked, Complete).'),
  tasks: z.string().describe('A JSON string of tasks associated with the project. Each task has a name, description, and status.'),
});

export type GenerateProjectSummaryInput = z.infer<typeof GenerateProjectSummaryInputSchema>;

const GenerateProjectSummaryOutputSchema = z.object({
  executiveSummary: z.string().describe('A concise executive summary of the project.'),
  riskAssessment: z.string().describe('Identified risks and potential bottlenecks.'),
  actionableSuggestions: z.string().describe('Proactive, actionable suggestions for the project manager.'),
});

export type GenerateProjectSummaryOutput = z.infer<typeof GenerateProjectSummaryOutputSchema>;

export async function generateProjectSummary(input: GenerateProjectSummaryInput): Promise<GenerateProjectSummaryOutput> {
  return generateProjectSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectSummaryPrompt',
  input: {schema: GenerateProjectSummaryInputSchema},
  output: {schema: GenerateProjectSummaryOutputSchema},
  prompt: `You are an AI assistant for project managers. Your task is to provide an executive summary of a given project,
  assess potential risks and bottlenecks, and offer actionable suggestions to improve project outcomes.

  Project Name: {{projectName}}
  Description: {{description}}
  Team Members: {{teamMembers}}
  Start Date: {{startDate}}
  Deadline: {{deadline}}
  Current Status: {{currentStatus}}
  Tasks: {{{tasks}}}
  
  Analyze all the information above, including the tasks, to inform your response.

  Provide the output in the following format:

  Executive Summary: A concise summary of the project status and objectives.
  Risk Assessment: Identify potential risks, bottlenecks, and challenges.
  Actionable Suggestions: Offer specific, practical suggestions to mitigate risks and improve project progress.
  `,
});

const generateProjectSummaryFlow = ai.defineFlow(
  {
    name: 'generateProjectSummaryFlow',
    inputSchema: GenerateProjectSummaryInputSchema,
    outputSchema: GenerateProjectSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
