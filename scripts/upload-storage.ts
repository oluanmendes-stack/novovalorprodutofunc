/**
 * Script para fazer upload de todos os catálogos, descritivos e imagens para Supabase Storage
 * 
 * Uso:
 * pnpm ts-node scripts/upload-storage.ts
 * 
 * Certifique-se de que os buckets foram criados no Supabase:
 * - catalogo
 * - descritivos  
 * - imagens
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing environment variables: VITE_SUPABASE_URL and/or SUPABASE_KEY"
  );
  console.error(
    "Please set these in your .env.local file or environment"
  );
  process.exit(1);
}

console.log("🔗 Connecting to Supabase...");
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UploadStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

const stats: UploadStats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
};

/**
 * Upload a single file to Supabase Storage
 */
async function uploadFile(
  filePath: string,
  bucket: string,
  relativePath: string
): Promise<boolean> {
  try {
    const fileContent = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(relativePath, fileContent, {
        cacheControl: "3600",
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error(`❌ Failed to upload ${relativePath}:`, error.message);
      return false;
    }

    console.log(`✅ Uploaded: ${bucket}/${relativePath}`);
    return true;
  } catch (err) {
    console.error(`❌ Error uploading ${filePath}:`, err);
    return false;
  }
}

/**
 * Recursively upload all files from a directory
 */
async function uploadDirectory(
  sourceDir: string,
  bucket: string,
  bucketPrefix: string = ""
): Promise<void> {
  const files = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(sourceDir, file.name);
    const relativePath = path.join(bucketPrefix, file.name).replace(/\\/g, "/");

    if (file.isDirectory()) {
      // Recursively upload subdirectories
      await uploadDirectory(fullPath, bucket, relativePath);
    } else if (file.isFile()) {
      stats.total++;

      // Skip certain files
      if (
        file.name.endsWith(".lnk") ||
        file.name.startsWith("Novo Documento") ||
        file.name === "Descritivos.lnk"
      ) {
        console.log(`⏭️  Skipped: ${relativePath}`);
        stats.skipped++;
        continue;
      }

      const success = await uploadFile(fullPath, bucket, relativePath);
      if (success) {
        stats.success++;
      } else {
        stats.failed++;
      }
    }
  }
}

/**
 * Main upload process
 */
async function main() {
  const catalogDir = path.resolve(__dirname, "../public/catalogo");

  if (!fs.existsSync(catalogDir)) {
    console.error(
      `❌ Catalog directory not found: ${catalogDir}`
    );
    process.exit(1);
  }

  console.log("\n📦 Starting file uploads...\n");

  // Upload catalogs (root .doc files)
  console.log("📄 Uploading catalogs (.doc files)...");
  const catalogFiles = fs
    .readdirSync(catalogDir)
    .filter((f) => f.endsWith(".doc"));

  for (const file of catalogFiles) {
    stats.total++;
    const fullPath = path.join(catalogDir, file);
    const success = await uploadFile(fullPath, "catalogo", file);
    if (success) stats.success++;
    else stats.failed++;
  }

  // Upload descriptors
  console.log("\n📝 Uploading descriptors (.txt files)...");
  const descriptorDir = path.join(catalogDir, "descritivos");
  if (fs.existsSync(descriptorDir)) {
    await uploadDirectory(descriptorDir, "descritivos");
  } else {
    console.log("⚠️  Descriptors directory not found");
  }

  // Upload images
  console.log("\n🖼️  Uploading images...");
  const imagesDir = path.join(catalogDir, "imagens");
  if (fs.existsSync(imagesDir)) {
    await uploadDirectory(imagesDir, "imagens");
  } else {
    console.log("⚠️  Images directory not found");
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Upload Summary:");
  console.log(`Total files:  ${stats.total}`);
  console.log(`✅ Uploaded:   ${stats.success}`);
  console.log(`❌ Failed:     ${stats.failed}`);
  console.log(`⏭️  Skipped:    ${stats.skipped}`);
  console.log("=".repeat(60) + "\n");

  if (stats.failed > 0) {
    console.log("⚠️  Some files failed to upload. Please check the errors above.");
  } else {
    console.log("✨ All files uploaded successfully!");
  }
}

main().catch(console.error);
