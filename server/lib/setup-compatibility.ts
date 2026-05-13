import { createClient } from "@supabase/supabase-js";

/**
 * Setup compatibility table RLS policies
 * This should be run once to allow unauthenticated users to save images
 */
export async function setupCompatibilityRLS() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("[setupCompatibilityRLS] Supabase not configured, skipping RLS setup");
    return;
  }

  try {
    // Use service role key (admin) to execute administrative operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[setupCompatibilityRLS] Attempting to update RLS policies...");

    // Execute SQL to update RLS policies
    const { data, error } = await supabase.rpc("execute_sql", {
      sql: `
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.compatibility;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.compatibility;
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.compatibility;
        DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.compatibility;
        
        CREATE POLICY "Allow read access for all" ON public.compatibility
          FOR SELECT
          USING (true);
        
        CREATE POLICY "Allow insert for all" ON public.compatibility
          FOR INSERT
          WITH CHECK (true);
        
        CREATE POLICY "Allow update for all" ON public.compatibility
          FOR UPDATE
          USING (true)
          WITH CHECK (true);
        
        CREATE POLICY "Allow delete for all" ON public.compatibility
          FOR DELETE
          USING (true);
      `,
    });

    if (error) {
      console.warn("[setupCompatibilityRLS] Could not update RLS policies via RPC:", error.message);
      console.warn("[setupCompatibilityRLS] Please manually run the SQL from SUPABASE_SETUP.md");
      return;
    }

    console.log("[setupCompatibilityRLS] RLS policies updated successfully");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("function execute_sql") || errorMsg.includes("does not exist")) {
      console.warn("[setupCompatibilityRLS] RPC execute_sql not available");
      console.warn("[setupCompatibilityRLS] Please manually run the SQL from SUPABASE_SETUP.md");
    } else {
      console.error("[setupCompatibilityRLS] Error:", err);
    }
  }
}
