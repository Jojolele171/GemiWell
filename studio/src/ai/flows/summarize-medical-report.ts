'use server';

/**
 * @fileOverview Summarizes and extracts data from medical reports using Gemini's multimodal capabilities.
 * Supports multi-image/batch analysis with deep clinical reasoning.
 * Includes structured error handling for safety policy enforcement and readability issues.
 * 
 * - summarizeMedicalReport - A function that handles the medical report analysis.
 * - SummarizeMedicalReportInput - The input type for the summarizeMedicalReport function.
 * - SummarizeMedicalReportOutput - The return type for the summarizeMedicalReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeMedicalReportInputSchema = z.object({
  reportText: z.string().optional().describe('Manual text input from the user.'),
  photoDataUris: z
    .array(z.string())
    .optional()
    .describe(
      "A list of photos or PDFs of medical reports, as data URIs that must include a MIME type and use Base64 encoding."
    ),
  userName: z.string().optional().describe('The name to address the user by.'),
});
export type SummarizeMedicalReportInput = z.infer<typeof SummarizeMedicalReportInputSchema>;

const SummarizeMedicalReportOutputSchema = z.object({
  summary: z.string().optional().describe('The comprehensive clinical analysis or general summary if non-medical.'),
  confidenceLevel: z.number().optional().describe('AI confidence in the extraction/analysis (0-1).'),
  rawExtractedText: z.string().optional().describe('The full, comprehensive raw text extracted for transparency.'),
  structuredInsights: z.object({
    blood_sugar_level: z.string().optional().describe('Extracted blood sugar level.'),
    hbA1c: z.string().optional().describe('Extracted HbA1c percentage.'),
    cholesterol: z.string().optional().describe('Extracted cholesterol level.'),
  }).optional(),
  isMedical: z.boolean().optional().describe('Whether the input was identified as a medical document.'),
  error: z.string().optional().describe('A descriptive error message if the content violates policies, analysis fails, or photos are unclear.'),
});
export type SummarizeMedicalReportOutput = z.infer<typeof SummarizeMedicalReportOutputSchema>;

export async function summarizeMedicalReport(input: SummarizeMedicalReportInput): Promise<SummarizeMedicalReportOutput> {
  try {
    return await summarizeMedicalReportFlow(input);
  } catch (error: any) {
    return {
      error: "Analysis failed. Please provide clearer photos.",
    };
  }
}

const medicalReportPrompt = ai.definePrompt({
  name: 'medicalReportAnalysisPrompt',
  input: { schema: SummarizeMedicalReportInputSchema },
  output: { schema: SummarizeMedicalReportOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
  prompt: `You are an expert medical data analyst.
  
  TASK:
  1. Address the user as {{#if userName}}{{userName}}{{else}}User{{/if}}.
  2. If the input is a medical report, perform an exhaustive, deep-dive clinical analysis. Identify ALL out-of-range values, every doctor note, and all clinical impressions. 
  3. DO NOT TRUNCATE YOUR ANALYSIS. Provide a full and comprehensive explanation of every finding. Your assessment must be thorough and cover the entire document provided.
  4. If the input is NOT a medical report, provide a friendly general summary of the content and note that it does not appear to be a medical document. 
  5. Summarize ANY safe content provided. Only block content that is sexually explicit, violent, hateful, or dangerous.
  6. If the images are too blurry to read, set the error field to "Analysis failed. Please provide clearer photos."

  {{#if reportText}}
  USER INPUT TEXT:
  {{{reportText}}}
  {{/if}}

  {{#if photoDataUris}}
  USER INPUT DOCUMENTS:
  {{#each photoDataUris}}
  DOCUMENT:
  {{media url=this}}
  {{/each}}
  {{/if}}

  CRITICAL RULES:
  - FULL DISCLOSURE: Analyze every detail. Do not leave out information for the sake of brevity.
  - SAFETY: If the content violates safety policies (pornography, extreme violence, hate speech, erotica), you MUST refuse to process it and return an error result.`,
});

const summarizeMedicalReportFlow = ai.defineFlow(
  {
    name: 'summarizeMedicalReportFlow',
    inputSchema: SummarizeMedicalReportInputSchema,
    outputSchema: SummarizeMedicalReportOutputSchema,
  },
  async (input) => {
    const { output, response } = await medicalReportPrompt(input);

    if (response?.candidates?.[0]?.finishReason === 'SAFETY') {
       return { error: "Prohibited content detected. This content violates our safety policies and cannot be processed or saved." };
    }

    if (!output || (!output.summary && !output.error)) {
      return { error: "Analysis failed. Please provide clearer photos." };
    }

    const summaryLower = output.summary?.toLowerCase() || '';
    if (summaryLower.includes("can't help with that") || summaryLower.includes("violate") || summaryLower.includes("prohibited")) {
       return { error: "Prohibited content detected. This content violates our safety policies and cannot be processed or saved." };
    }

    return output;
  }
);
