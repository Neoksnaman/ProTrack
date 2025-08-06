'use server';

/**
 * @fileOverview AI-powered actionable suggestions for project improvement.
 *
 * - provideActionableSuggestions - A function that offers suggestions for improving project outcomes.
 * - ActionableSuggestionsInput - The input type for the provideActionableSuggestions function.
 * - ActionableSuggestionsOutput - The return type for the provideActionableSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActionableSuggestionsInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  projectDescription: z.string().describe('A detailed description of the project.'),
  teamMembers: z.array(z.string()).describe('List of team members involved in the project.'),
  startDate: z.string().describe('The start date of the project (YYYY-MM-DD).'),
  deadline: z.string().describe('The project deadline (YYYY-MM-DD).'),
  currentStatus: z.string().describe('The current status of the project (e.g., Planning, In Progress, Blocked, Complete).'),
});
export type ActionableSuggestionsInput = z.infer<typeof ActionableSuggestionsInputSchema>;

const ActionableSuggestionsOutputSchema = z.object({
  riskAssessment: z.string().describe('An assessment of potential risks to the project.'),
  bottleneckAnalysis: z.string().describe('An analysis of potential bottlenecks in the project workflow.'),
  suggestions: z.array(z.string()).describe('A list of actionable suggestions to improve project outcomes.'),
  executiveSummary: z.string().describe('A concise executive summary of the project status and recommendations.'),
});
export type ActionableSuggestionsOutput = z.infer<typeof ActionableSuggestionsOutputSchema>;

export async function provideActionableSuggestions(input: ActionableSuggestionsInput): Promise<ActionableSuggestionsOutput> {
  return actionableSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'actionableSuggestionsPrompt',
  input: {schema: ActionableSuggestionsInputSchema},
  output: {schema: ActionableSuggestionsOutputSchema},
  prompt: `You are an AI project management assistant. Analyze the project information provided and offer actionable suggestions for improvement.

Project Name: {{{projectName}}}
Description: {{{projectDescription}}}
Team Members: {{#each teamMembers}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Start Date: {{{startDate}}}
Deadline: {{{deadline}}}
Current Status: {{{currentStatus}}}

Provide the following:

1.  Risk Assessment: Identify potential risks that could impact the project.
2.  Bottleneck Analysis: Analyze potential bottlenecks in the project workflow.
3.  Suggestions: Offer specific, actionable suggestions to improve project outcomes.
4.  Executive Summary: A concise summary of the project status and your recommendations.

Ensure the suggestions are clear, practical, and directly related to the project details provided.
`,
});

const actionableSuggestionsFlow = ai.defineFlow(
  {
    name: 'actionableSuggestionsFlow',
    inputSchema: ActionableSuggestionsInputSchema,
    outputSchema: ActionableSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
