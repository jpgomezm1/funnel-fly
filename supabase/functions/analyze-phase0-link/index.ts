import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface Phase0Analysis {
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the URL content
    console.log('Fetching URL:', url);
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Phase0Analyzer/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!pageResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${pageResponse.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const htmlContent = await pageResponse.text();
    console.log('Fetched content length:', htmlContent.length);

    // Send to Claude for analysis
    const prompt = `Analiza el siguiente contenido HTML de una página de propuesta/proyecto "Fase 0" y extrae la información estructurada.

El contenido es de una página de presentación de proyecto que típicamente contiene:
- Información del cliente
- Nombre del proyecto
- Descripción del proyecto
- Stack tecnológico propuesto
- Fases de desarrollo con tiempos y entregables
- Métricas de éxito
- Features principales

CONTENIDO HTML:
${htmlContent.substring(0, 50000)}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin explicaciones, solo el JSON):
{
  "client_name": "nombre del cliente/empresa",
  "project_name": "nombre del proyecto",
  "description": "descripción técnica detallada del proyecto orientada a ingeniería (2-3 párrafos)",
  "tech_stack": ["tecnología1", "tecnología2"],
  "phases": [
    {
      "name": "nombre de la fase",
      "duration": "duración estimada",
      "deliverables": ["entregable1", "entregable2"]
    }
  ],
  "success_metrics": ["métrica1", "métrica2"],
  "key_features": ["feature1", "feature2"],
  "total_duration": "duración total estimada"
}

Si no encuentras información para algún campo, usa un valor vacío apropiado (string vacío o array vacío).
Asegúrate de que la descripción sea técnica y útil para el equipo de desarrollo.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return new Response(
        JSON.stringify({ error: 'Error calling Anthropic API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.content[0]?.text || '';
    console.log('AI Response:', aiResponse.substring(0, 500));

    // Parse the JSON response
    let analysis: Phase0Analysis;
    try {
      // Clean up the response in case it has markdown code blocks
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: aiResponse }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-phase0-link function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
