'use server';

/**
 * @fileOverview Deprecated service. Medical data extraction is now handled directly by Gemini in the AI flow.
 */

export type ExtractedMedicalData = {
  blood_sugar_level?: string;
  hbA1c?: string;
  cholesterol?: string;
  patient_name?: string;
  rawText?: string;
};

/**
 * @deprecated Use summarizeMedicalReport flow which utilizes Gemini's multimodal extraction.
 */
export async function extractMedicalData(dataUri: string): Promise<ExtractedMedicalData> {
  console.warn('extractMedicalData is deprecated. Extraction is now handled by Gemini.');
  return { rawText: 'Service deprecated. Please use the summarizeMedicalReport AI flow.' };
}
