'use server';
/**
 * @fileOverview An AI health coaching assistant (GemiCare) that provides personalized advice.
 * Includes structured error handling for safety policy enforcement.
 *
 * - getHealthAdviceFromAIChat - A function that handles the health advice process.
 * - HealthAdviceInput - The input type for the getHealthAdviceFromAIChat function.
 * - HealthAdviceOutput - The return type for the getHealthAdviceFromAIChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HealthAdviceInputSchema = z.object({
  query: z.string().describe('The user query for health advice.'),
  healthProfile: z.object({
    conditions: z.string().optional(),
    habits: z.string().optional(),
    diet: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
    age: z.string().optional(),
  }).optional().describe('The user health profile for context.'),
  recentReports: z.array(z.object({
    summary: z.string(),
    dateLabel: z.string(),
    structuredData: z.any().optional(),
  })).optional().describe('Recent medical report summaries for context.'),
});
export type HealthAdviceInput = z.infer<typeof HealthAdviceInputSchema>;

const HealthAdviceOutputSchema = z.object({
  advice: z.string().optional().describe('The health advice from the AI.'),
  error: z.string().optional().describe('Safety violation or processing error message.'),
});
export type HealthAdviceOutput = z.infer<typeof HealthAdviceOutputSchema>;

export async function getHealthAdviceFromAIChat(input: HealthAdviceInput): Promise<HealthAdviceOutput> {
  try {
    return await getHealthAdviceFromAIChatFlow(input);
  } catch (err: any) {
    return { error: "An unexpected error occurred while generating advice." };
  }
}

const prompt = ai.definePrompt({
  name: 'healthAdvicePrompt',
  input: {schema: HealthAdviceInputSchema},
  output: {schema: HealthAdviceOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
  system: `You are GemiCare, a friendly AI health coach.

IMPORTANT: You are NOT a doctor. You provide lifestyle guidance.

SEXUAL HEALTH POLICY:
- Distinguish between medical/wellness queries (e.g., STI concerns, reproductive cycles) and erotica.
- Clinical sexual health questions are ALLOWED and should be answered professionally.
- Erotica and graphic content are STRICTLY PROHIBITED. Return an error if erotica is detected.`,
  prompt: `
      {{#if healthProfile}}
      USER CONTEXT:
      - Age: {{healthProfile.age}}, Weight: {{healthProfile.weight}}kg, Height: {{healthProfile.height}}cm
      - Conditions: {{healthProfile.conditions}}
      - Habits: {{healthProfile.habits}}
      {{/if}}

      {{#if recentReports}}
      REPORTS:
      {{#each recentReports}}
      - {{dateLabel}}: {{summary}}
      {{/each}}
      {{/if}}

      QUERY: {{{query}}}`,
});

const getHealthAdviceFromAIChatFlow = ai.defineFlow(
  {
    name: 'getHealthAdviceFromAIChatFlow',
    inputSchema: HealthAdviceInputSchema,
    outputSchema: HealthAdviceOutputSchema,
  },
  async input => {
    const {output, response} = await prompt(input);

    if (response?.candidates?.[0]?.finishReason === 'SAFETY') {
      return { error: "Prohibited content detected. This content violates our safety policies and cannot be processed or saved." };
    }

    if (!output || (!output.advice && !output.error)) {
       return { error: "Processing failed. The content may be prohibited." };
    }

    const adviceLower = output.advice?.toLowerCase() || '';
    if (adviceLower.includes("can't help with that") || adviceLower.includes("violate") || adviceLower.includes("prohibited")) {
       return { error: "Prohibited content detected. This content violates our safety policies and cannot be processed or saved." };
    }

    return output;
  }
);
