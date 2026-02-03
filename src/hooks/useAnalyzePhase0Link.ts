import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Phase0Analysis {
  client_name: string;
  project_name: string;
  description: string;
  tech_stack: string[];
  phases: {
    name: string;
    duration: string;
    deliverables: string[];
  }[];
  success_metrics: string[];
  key_features: string[];
  total_duration: string;
}

interface AnalyzeResult {
  success: boolean;
  analysis?: Phase0Analysis;
  error?: string;
}

export function useAnalyzePhase0Link() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLink = async (url: string): Promise<Phase0Analysis | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<AnalyzeResult>(
        'analyze-phase0-link',
        { body: { url } }
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.success || !data?.analysis) {
        throw new Error(data?.error || 'Failed to analyze link');
      }

      return data.analysis;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al analizar el link';
      setError(errorMessage);
      console.error('Error analyzing Phase 0 link:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeLink,
    isAnalyzing,
    error,
    clearError: () => setError(null),
  };
}
