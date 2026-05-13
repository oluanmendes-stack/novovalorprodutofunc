import path from "path";
import * as fs from "fs";
import * as path from "path";
import { createServer } from "./index";
import * as express from "express";

async function startServer() {
  const app = await createServer();
  const port = process.env.PORT || 3000;

  // In production, serve the built SPA files
  const __dirname = import.meta.dirname;
  const distPath = path.join(__dirname, "../spa");
  const publicPath = path.join(__dirname, "../public");

  console.log(`\n[Server] Static file serving paths:`);
  console.log(`  __dirname: ${__dirname}`);
  console.log(`  process.cwd(): ${process.cwd()}`);
  console.log(`  publicPath: ${publicPath} (exists: ${fs.existsSync(publicPath)})`);
  console.log(`  distPath: ${distPath} (exists: ${fs.existsSync(distPath)})`);

  // Serve public static files (catalogo, imagens, etc.)
  // Try main public path first
  if (fs.existsSync(publicPath)) {
    console.log(`  ✓ Serving public static files from: ${publicPath}`);
    app.use(express.static(publicPath));
  } else {
    console.log(`  ✗ Public path not found, trying alternative paths...`);
    // Try alternative paths
    const altPublicPath = path.join(process.cwd(), "public");
    if (fs.existsSync(altPublicPath)) {
      console.log(`  ✓ Serving public static files from: ${altPublicPath}`);
      app.use(express.static(altPublicPath));
    } else {
      console.log(`  ✗ No public directory found`);
    }
  }

  // Serve built SPA static files
  console.log(`  ✓ Serving SPA static files from: ${distPath}`);
  app.use(express.static(distPath));
  console.log();

  // Handle React Router - serve index.html for all non-API routes
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    const indexPath = path.join(distPath, "index.html");
    const buffer = fs.readFileSync(indexPath);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buffer);
  });

  app.listen(port, () => {
    console.log(`🚀 Fusion Starter server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("🛑 Received SIGTERM, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("🛑 Received SIGINT, shutting down gracefully");
    process.exit(0);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
