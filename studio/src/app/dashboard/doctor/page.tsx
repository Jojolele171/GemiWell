'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { compareDoctorVsAIReasoning } from '@/ai/flows/compare-doctor-vs-ai-reasoning';
import type { CompareDoctorVsAIReasoningOutput } from '@/ai/flows/compare-doctor-vs-ai-reasoning';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';

const samplePatientData = `Patient: 45-year-old male
Symptoms: Chest pain, shortness of breath, fatigue
History: Smoker (1 pack/day), Type 2 Diabetes, High Cholesterol
Vitals: BP 150/95, HR 95, SpO2 94% on room air
ECG: Normal Sinus Rhythm, no acute ST changes
Lab Work: Troponin negative, D-dimer elevated.`;

export default function DoctorViewPage() {
  const [patientData, setPatientData] = useState(samplePatientData);
  const [doctorReasoning, setDoctorReasoning] = useState('');
  const [aiComparison, setAiComparison] = useState<CompareDoctorVsAIReasoningOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCompare = async () => {
    if (!patientData.trim() || !doctorReasoning.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide both patient data and your reasoning.',
      });
      return;
    }
    setIsLoading(true);
    setAiComparison(null);
    try {
      const result = await compareDoctorVsAIReasoning({ patientData, doctorReasoning });
      setAiComparison(result);
    } catch (error) {
      console.error('Error comparing reasoning:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get AI comparison. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Doctor vs. AI Reasoning</h1>
        <p className="text-muted-foreground">
          Compare your clinical reasoning with AI-driven analysis for deeper insights.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-data">Patient Data</Label>
              <Textarea
                id="patient-data"
                placeholder="Enter patient data, symptoms, history, etc."
                rows={10}
                value={patientData}
                onChange={(e) => setPatientData(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor-reasoning">Your Reasoning</Label>
              <Textarea
                id="doctor-reasoning"
                placeholder="Describe your diagnosis, thought process, and treatment plan."
                rows={6}
                value={doctorReasoning}
                onChange={(e) => setDoctorReasoning(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleCompare} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Analyzing...' : 'Compare with AI'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {isLoading ? (
             <Card className="h-full">
                <CardHeader>
                  <div className="h-6 w-1/3 rounded bg-muted animate-pulse"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-1/4 rounded bg-muted animate-pulse"></div>
                    <div className="h-4 w-full rounded bg-muted animate-pulse"></div>
                    <div className="h-4 w-4/5 rounded bg-muted animate-pulse"></div>
                  </div>
                   <div className="space-y-2">
                    <div className="h-4 w-1/4 rounded bg-muted animate-pulse"></div>
                    <div className="h-4 w-full rounded bg-muted animate-pulse"></div>
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse"></div>
                  </div>
                </CardContent>
             </Card>
          ) : (
            aiComparison && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>AI Reasoning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{aiComparison.aiReasoning}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{aiComparison.comparison}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{aiComparison.insights}</p>
                  </CardContent>
                </Card>
              </>
            )
          )}
          {!isLoading && !aiComparison && (
            <Card className="flex h-full flex-col items-center justify-center">
              <CardContent className="text-center">
                <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">AI Comparison will appear here</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter patient data and your reasoning to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
