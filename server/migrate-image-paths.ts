/**
 * Migration script to update image paths in compatibility records
 * Converts: imagens/... → public/catalogo/imagens/...
 * 
 * Run with: npx ts-node server/migrate-image-paths.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL and SUPABASE_KEY environment variables are required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Convert old image path format to new format
 * imagens/... → public/catalogo/imagens/...
 */
function migrateImagePath(path: string): string {
  if (path.startsWith("imagens/")) {
    return path.replace(/^imagens\//, "public/catalogo/imagens/");
  }
  return path;
}

/**
 * Migrate image paths in a compatibility record
 */
function migrateRecord(record: any): any {
  return {
    ...record,
    foto_produto: (record.foto_produto || []).map(migrateImagePath),
    foto_conexao: (record.foto_conexao || []).map(migrateImagePath),
  };
}

async function runMigration() {
  try {
    console.log("🔄 Starting image path migration...\n");

    // Fetch all compatibility records
    const { data: records, error: fetchError } = await supabase
      .from("compatibility")
      .select("*");

    if (fetchError) {
      throw new Error(`Failed to fetch records: ${fetchError.message}`);
    }

    if (!records || records.length === 0) {
      console.log("✅ No records to migrate");
      process.exit(0);
    }

    console.log(`📦 Found ${records.length} compatibility records\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each record
    for (const record of records) {
      const oldFotosProduto = record.foto_produto || [];
      const oldFotosConexao = record.foto_conexao || [];

      // Migrate paths
      const newRecord = migrateRecord(record);

      // Check if anything changed
      const fotoProdutoChanged = oldFotosProduto.some((path) => migrateImagePath(path) !== path);
      const fotoConexaoChanged = oldFotosConexao.some((path) => migrateImagePath(path) !== path);

      if (!fotoProdutoChanged && !fotoConexaoChanged) {
        skippedCount++;
        continue;
      }

      // Update record in Supabase
      const { error: updateError } = await supabase
        .from("compatibility")
        .update({
          foto_produto: newRecord.foto_produto,
          foto_conexao: newRecord.foto_conexao,
        })
        .eq("id", record.id);

      if (updateError) {
        console.error(`❌ Error updating record ${record.id}: ${updateError.message}`);
        continue;
      }

      updatedCount++;

      // Log the changes for the first few records
      if (updatedCount <= 5) {
        console.log(`✓ Record ${record.id} (${record.acessorio}):`);
        if (fotoProdutoChanged) {
          console.log(`  foto_produto: ${oldFotosProduto.length} paths updated`);
        }
        if (fotoConexaoChanged) {
          console.log(`  foto_conexao: ${oldFotosConexao.length} paths updated`);
        }
        console.log();
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Complete!");
    console.log("=".repeat(60));
    console.log(`✅ Updated: ${updatedCount} records`);
    console.log(`⏭️  Skipped: ${skippedCount} records (already migrated)`);
    console.log(`📦 Total: ${records.length} records`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
