'use server';

/**
 * @fileOverview Compares a doctor's reasoning with the AI’s reasoning on patient data.
 *
 * - compareDoctorVsAIReasoning - A function that compares doctor vs ai reasoning.
 * - CompareDoctorVsAIReasoningInput - The input type for the compareDoctorVsAIReasoning function.
 * - CompareDoctorVsAIReasoningOutput - The return type for the compareDoctorVsAIReasoning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompareDoctorVsAIReasoningInputSchema = z.object({
  patientData: z.string().describe('The patient data, including medical history, reports, and other relevant information.'),
  doctorReasoning: z.string().describe('The doctor’s reasoning and assessment of the patient data.'),
});
export type CompareDoctorVsAIReasoningInput = z.infer<typeof CompareDoctorVsAIReasoningInputSchema>;

const CompareDoctorVsAIReasoningOutputSchema = z.object({
  aiReasoning: z.string().describe('The AI’s reasoning and assessment of the patient data.'),
  comparison: z.string().describe('A comparison of the doctor’s reasoning and the AI’s reasoning, highlighting similarities and differences.'),
  insights: z.string().describe('Additional insights that the AI provides based on the patient data and the doctor’s reasoning.'),
  error: z.string().optional().describe('A descriptive error message if the content violates policies or analysis fails.'),
});
export type CompareDoctorVsAIReasoningOutput = z.infer<typeof CompareDoctorVsAIReasoningOutputSchema>;

export async function compareDoctorVsAIReasoning(
    input: CompareDoctorVsAIReasoningInput
): Promise<CompareDoctorVsAIReasoningOutput> {
  try {
    return await compareDoctorVsAIReasoningFlow(input);
  } catch (error: any) {
    return {
      aiReasoning: "",
      comparison: "",
      insights: "",
      error: "An unexpected error occurred during comparison.",
    };
  }
}

const prompt = ai.definePrompt({
  name: 'compareDoctorVsAIReasoningPrompt',
  input: {schema: CompareDoctorVsAIReasoningInputSchema},
  output: {schema: CompareDoctorVsAIReasoningOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
  prompt: `You are an AI assistant that helps doctors compare their reasoning with AI reasoning on patient data.

  Given the following patient data and the doctor's reasoning, provide the AI's reasoning, a comparison of the two, and any additional insights.

  Patient Data: {{{patientData}}}
  Doctor Reasoning: {{{doctorReasoning}}}

  AI Reasoning: // The AI's reasoning based on the patient data.
  Comparison: // A detailed comparison of the doctor's reasoning and the AI's reasoning, highlighting similarities and differences.
  Insights: // Additional insights that the AI provides based on the patient data and the doctor's reasoning.
  `,
});

const compareDoctorVsAIReasoningFlow = ai.defineFlow(
  {
    name: 'compareDoctorVsAIReasoningFlow',
    inputSchema: CompareDoctorVsAIReasoningInputSchema,
    outputSchema: CompareDoctorVsAIReasoningOutputSchema,
  },
  async input => {
    const {output, response} = await prompt(input);

    if (response?.candidates?.[0]?.finishReason === 'SAFETY') {
      return { 
        aiReasoning: "", 
        comparison: "", 
        insights: "", 
        error: "Prohibited content detected. This content violates our safety policies and cannot be processed or saved." 
      };
    }

    if (!output) {
       return { 
         aiReasoning: "", 
         comparison: "", 
         insights: "", 
         error: "Comparison failed. The content may be prohibited." 
       };
    }

    return output;
  }
);
