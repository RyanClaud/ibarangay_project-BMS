'use server';

/**
 * @fileOverview AI-powered insights generation for barangay data.
 *
 * This file defines a Genkit flow that leverages AI to analyze barangay data, providing insights into resident demographics,
 * document request patterns, and potential issues. It allows administrators to make data-driven decisions.
 *
 * @requires genkit
 * @requires z
 *
 * @exports generateInsights - An async function to trigger the insights generation flow.
 * @exports GenerateInsightsInput - The input type for the generateInsights function.
 * @exports GenerateInsightsOutput - The output type for the generateInsights function.
 */

import { getDocumentRequests, getResidents } from '@/firebase/data-fetchers';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the insights generation flow
const GenerateInsightsInputSchema = z.object({
  residentData: z.string().describe('JSON string containing an array of resident profiles, including demographic information.'),
  documentRequestData: z.string().describe('JSON string containing an array of document requests, including request details and status.'),
  parameters: z.string().optional().describe('Optional parameters to customize the generated insights, such as specific trends to analyze.'),
});

export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

// Define the output schema for the insights generation flow
const GenerateInsightsOutputSchema = z.object({
  insights: z.string().describe('A comprehensive analysis of the barangay data, including trends, potential issues, and actionable recommendations.'),
});

export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

// Define the main function to trigger the insights generation flow
export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input);
}

// Define the prompt for the AI model
const insightsPrompt = ai.definePrompt({
  name: 'insightsPrompt',
  input: {schema: GenerateInsightsInputSchema},
  output: {schema: GenerateInsightsOutputSchema},
  prompt: `You are an AI data analyst for a local government unit. Your task is to provide a clear, professional analysis of barangay data for the administrator. Write in a conversational, human-like tone.

  Analyze the following resident data and document request patterns to identify trends, potential issues, and actionable recommendations.

  Resident Data: {{{residentData}}}
  Document Request Data: {{{documentRequestData}}}
  Parameters: {{{parameters}}}

  Please format your response as a narrative report written in clear, well-formed paragraphs. Do not use markdown formatting like asterisks for bolding or bullet points for lists. Instead, weave the key findings and recommendations into the main body of the text to create a smooth, easy-to-read analysis.
`,
});

// Define the Genkit flow for generating insights from barangay data
const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async input => {
    const {output} = await insightsPrompt(input);
    return output!;
  }
);
