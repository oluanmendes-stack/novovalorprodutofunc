import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { findProductImagesSync } from "./images";

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  return url && key ? createClient(url, key) : null;
};

export interface CompatibilityRecord {
  id: string;
  equipamento: string;
  parametro: string;
  fabricante: string;
  modelo: string;
  acessorio: string;
  foto_produto: string[];
  foto_conexao: string[];
  observacoes: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Pass-through record structure
 * (Legacy migration logic removed since we now use pure Supabase Storage public URLs)
 */
function transformRecord(record: any): CompatibilityRecord {
  return record;
}

/**
 * Get all compatibility records
 */
export const getCompatibility: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    console.log("[getCompatibility] START");
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    console.log("[getCompatibility] Limit:", limit || "none");
    
    if (!supabase) {
      console.error("[getCompatibility] Supabase client not initialized");
      return res.status(500).json({
        success: false,
        error: "Supabase not configured on server",
      });
    }

    console.log("[getCompatibility] Fetching from table 'compatibility'...");
    let query = supabase
      .from("compatibility")
      .select("*")
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getCompatibility] Supabase error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch compatibility records",
      });
    }

    const transformedData = (data || []).map(transformRecord);
    console.log("[getCompatibility] SUCCESS - Fetched", transformedData.length, "records");
    
    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
    });
  } catch (error) {
    console.error("[getCompatibility] CRITICAL EXCEPTION:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server exception",
    });
  }
};

/**
 * Search compatibility records
 */
export const searchCompatibility: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Search query required",
      });
    }

    const query = q.toLowerCase();

    const { data, error } = await supabase
      .from("compatibility")
      .select("*")
      .or(
        `equipamento.ilike.%${query}%,fabricante.ilike.%${query}%,modelo.ilike.%${query}%,acessorio.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[searchCompatibility] Supabase error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to search compatibility records",
      });
    }

    const transformedData = (data || []).map(transformRecord);
    console.log(`[searchCompatibility] Found ${transformedData.length} results for "${query}"`);
    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
    });
  } catch (error) {
    console.error("[searchCompatibility] Exception error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to search compatibility records",
    });
  }
};

/**
 * Create a new compatibility record
 * Note: This endpoint should be used by the client to bypass RLS restrictions
 * since the client cannot authenticate on its own
 */
export const createCompatibility: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    const {
      equipamento,
      parametro,
      fabricante,
      modelo,
      acessorio,
      foto_produto,
      foto_conexao,
      observacoes,
    } = req.body;

    // Validate required fields
    if (!equipamento || !fabricante || !modelo || !acessorio) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: equipamento, fabricante, modelo, acessorio",
      });
    }

    console.log("[createCompatibility] Request body received:", JSON.stringify(req.body, null, 2));
    console.log("[createCompatibility] Creating record with images:", {
      acessorio,
      foto_produto_count: (foto_produto || []).length,
      foto_conexao_count: (foto_conexao || []).length,
      foto_produto: foto_produto,
      foto_conexao: foto_conexao,
    });

    const insertData = {
      equipamento,
      parametro: parametro || null,
      fabricante,
      modelo,
      acessorio,
      foto_produto: Array.isArray(foto_produto) ? foto_produto : [],
      foto_conexao: Array.isArray(foto_conexao) ? foto_conexao : [],
      observacoes: observacoes || null,
    };

    console.log("[createCompatibility] Data to be inserted into Supabase:", JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from("compatibility")
      .insert([insertData])
      .select();

    if (error) {
      console.error("[createCompatibility] Supabase error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create compatibility record",
      });
    }

    console.log("[createCompatibility] Record created with response data:", JSON.stringify(data, null, 2));
    const transformedRecord = data?.[0] ? transformRecord(data[0]) : null;
    res.status(201).json({
      success: true,
      data: transformedRecord,
    });
  } catch (error) {
    console.error("[createCompatibility] Exception error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create compatibility record",
    });
  }
};

/**
 * Update a compatibility record
 */
export const updateCompatibility: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    const { id } = req.params;
    const {
      equipamento,
      parametro,
      fabricante,
      modelo,
      acessorio,
      foto_produto,
      foto_conexao,
      observacoes,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Record ID is required",
      });
    }

    const updateData: any = {};
    if (equipamento !== undefined) updateData.equipamento = equipamento;
    if (parametro !== undefined) updateData.parametro = parametro;
    if (fabricante !== undefined) updateData.fabricante = fabricante;
    if (modelo !== undefined) updateData.modelo = modelo;
    if (acessorio !== undefined) updateData.acessorio = acessorio;
    if (foto_produto !== undefined) updateData.foto_produto = foto_produto;
    if (foto_conexao !== undefined) updateData.foto_conexao = foto_conexao;
    if (observacoes !== undefined) updateData.observacoes = observacoes;
    updateData.updated_at = new Date().toISOString();

    console.log("[updateCompatibility] Request body:", JSON.stringify(req.body, null, 2));
    console.log("[updateCompatibility] Update data:", JSON.stringify(updateData, null, 2));

    const { data, error } = await supabase
      .from("compatibility")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("[updateCompatibility] Supabase error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update compatibility record",
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Compatibility record not found",
      });
    }

    console.log("[updateCompatibility] Record updated successfully:", {
      id,
      updated_data: JSON.stringify(data[0], null, 2)
    });
    const transformedRecord = transformRecord(data[0]);
    res.json({
      success: true,
      data: transformedRecord,
    });
  } catch (error) {
    console.error("[updateCompatibility] Exception error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update compatibility record",
    });
  }
};

/**
 * Delete a compatibility record
 */
export const deleteCompatibility: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Record ID is required",
      });
    }

    const { error } = await supabase
      .from("compatibility")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[deleteCompatibility] Supabase error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to delete compatibility record",
      });
    }

    console.log("[deleteCompatibility] Record deleted:", id);
    res.json({
      success: true,
      message: "Compatibility record deleted successfully",
    });
  } catch (error) {
    console.error("[deleteCompatibility] Exception error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete compatibility record",
    });
  }
};

/**
 * Import compatibility records from CSV with auto-detection of product images
 */
export const importCompatibility: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    console.log("[importCompatibility] Request received");
    console.log("[importCompatibility] Body:", JSON.stringify(req.body).substring(0, 200));

    if (!supabase) {
      console.error("[importCompatibility] Supabase not configured");
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    const { csvData, autoDetectImages } = req.body;
    console.log("[importCompatibility] csvData length:", csvData?.length);
    console.log("[importCompatibility] autoDetectImages:", autoDetectImages);

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      console.error("[importCompatibility] Invalid csvData");
      return res.status(400).json({
        success: false,
        error: "CSV data is required and must be a non-empty array",
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of csvData) {
      try {
        // Extract fields from CSV row (handle case-insensitive headers)
        const equipamento = row["EQUIPAMENTO"] || row["equipamento"] || row["Equipamento"] || "";
        const parametro = row["PARAMETRO"] || row["parametro"] || row["Parametro"] || "";
        const fabricante = row["FABRICANTE"] || row["fabricante"] || row["Fabricante"] || "";
        const modelo = row["MODELO"] || row["modelo"] || row["Modelo"] || "";
        const acessorio =
          row["CÓDIGO DO PRODUTO"] ||
          row["codigo_do_produto"] ||
          row["Código do Produto"] ||
          row["acessorio"] ||
          row["Acessorio"] ||
          "";
        const observacoes = row["OBSERVAÇÕES"] || row["observacoes"] || row["Observações"] || "";

        // Validate required fields
        if (!equipamento || !fabricante || !modelo || !acessorio) {
          errorCount++;
          results.push({
            acessorio: acessorio || "unknown",
            success: false,
            error: "Missing required fields: equipamento, fabricante, modelo, acessorio",
          });
          continue;
        }

        // Auto-detect images if enabled
        let foto_produto: string[] = [];
        let foto_conexao: string[] = [];

        if (autoDetectImages) {
          try {
            foto_produto = findProductImagesSync(acessorio);
            console.log(`[importCompatibility] Found ${foto_produto.length} images for "${acessorio}"`);
          } catch (error) {
            console.warn(`[importCompatibility] Error finding images for "${acessorio}":`, error);
          }
        }

        // Create the compatibility record
        const { data, error } = await supabase
          .from("compatibility")
          .insert([
            {
              equipamento,
              parametro: parametro || null,
              fabricante,
              modelo,
              acessorio,
              foto_produto,
              foto_conexao,
              observacoes: observacoes || null,
            },
          ])
          .select();

        if (error) {
          errorCount++;
          console.error(`[importCompatibility] Error inserting record for "${acessorio}":`, error);
          results.push({
            acessorio,
            success: false,
            error: error.message,
          });
        } else {
          successCount++;
          results.push({
            acessorio,
            success: true,
            id: data?.[0]?.id,
            imagesFound: foto_produto.length,
          });
        }
      } catch (rowError) {
        errorCount++;
        console.error("[importCompatibility] Error processing row:", rowError);
        results.push({
          acessorio: row["CÓDIGO DO PRODUTO"] || row["acessorio"] || "unknown",
          success: false,
          error: rowError instanceof Error ? rowError.message : "Unknown error",
        });
      }
    }

    console.log(
      `[importCompatibility] Imported ${successCount} records successfully, ${errorCount} failed`
    );

    const responseData = {
      success: true,
      message: `Importação concluída: ${successCount} registros criados, ${errorCount} erros`,
      successCount,
      errorCount,
      results,
    };

    console.log("[importCompatibility] Sending response:", JSON.stringify(responseData).substring(0, 200));
    res.json(responseData);
  } catch (error) {
    console.error("[importCompatibility] Exception error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to import compatibility records",
    });
  }
};

/**
 * Fix RLS policies to allow anonymous access (called once on startup)
 */
export const fixRLSPolicies: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    // Use the service role key (via the server) to execute administrative SQL
    // This updates the RLS policies to allow anonymous access
    const { error } = await supabase.rpc("execute_sql", {
      sql: `
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON compatibility;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON compatibility;
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON compatibility;
        DROP POLICY IF EXISTS "Enable delete for authenticated users" ON compatibility;

        CREATE POLICY "Allow read access for all" ON compatibility
          FOR SELECT
          USING (true);

        CREATE POLICY "Allow insert for all" ON compatibility
          FOR INSERT
          WITH CHECK (true);

        CREATE POLICY "Allow update for all" ON compatibility
          FOR UPDATE
          USING (true)
          WITH CHECK (true);

        CREATE POLICY "Allow delete for all" ON compatibility
          FOR DELETE
          USING (true);
      `,
    });

    if (error) {
      console.error("[fixRLSPolicies] Error updating RLS policies:", error);
      return res.status(500).json({
        success: false,
        error: "This endpoint requires manual setup via Supabase dashboard. See SQL_COMPATIBILITY.sql file.",
      });
    }

    res.json({
      success: true,
      message: "RLS policies updated successfully",
    });
  } catch (error) {
    console.error("[fixRLSPolicies] Exception error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update RLS policies - please run the SQL migration manually via Supabase dashboard",
    });
  }
};
