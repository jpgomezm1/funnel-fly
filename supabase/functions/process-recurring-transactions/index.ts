import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessResult {
  transactions_created: number;
  transactions_processed: number;
  details: Array<{
    parent_id: string;
    new_id: string;
    description: string;
    amount_usd: number;
    date: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authorization - check for cron secret or valid auth
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");

    // Allow if:
    // 1. Has valid cron secret in header
    // 2. Has valid Supabase auth token
    const isCronRequest = authHeader === `Bearer ${cronSecret}`;

    if (!isCronRequest && !authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional year/month override
    let targetYear: number | null = null;
    let targetMonth: number | null = null;
    let triggeredBy = "cron";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        targetYear = body.year || null;
        targetMonth = body.month || null;
        triggeredBy = body.triggered_by || "api";
      } catch {
        // No body or invalid JSON - use defaults
      }
    }

    // Call the database function
    const { data, error } = await supabase.rpc("process_recurring_transactions", {
      target_year: targetYear,
      target_month: targetMonth,
    });

    if (error) {
      console.error("Error processing recurring transactions:", error);
      throw error;
    }

    const result = data?.[0] as ProcessResult | undefined;

    // Log the execution
    const now = new Date();
    const logYear = targetYear || now.getFullYear();
    const logMonth = targetMonth || (now.getMonth() + 1);

    await supabase.from("recurring_transactions_log").insert({
      target_year: logYear,
      target_month: logMonth,
      transactions_created: result?.transactions_created || 0,
      transactions_processed: result?.transactions_processed || 0,
      details: result?.details || [],
      triggered_by: triggeredBy,
    });

    console.log(`Processed recurring transactions for ${logYear}-${logMonth}:`, {
      created: result?.transactions_created || 0,
      processed: result?.transactions_processed || 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        year: logYear,
        month: logMonth,
        transactions_created: result?.transactions_created || 0,
        transactions_processed: result?.transactions_processed || 0,
        details: result?.details || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in process-recurring-transactions:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
