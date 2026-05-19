import { createServer } from "../server";
import serverless from "serverless-http";

let app: any;
let handler: any;

export default async (req: any, res: any) => {
  try {
    if (!app) {
      console.log("[Vercel API] Initializing Express app...");
      app = await createServer();
      handler = serverless(app);
      console.log("[Vercel API] Express app and serverless handler initialized.");
    }

    console.log(`[Vercel API] Request: ${req.method} ${req.url}`);
    console.log(`[Vercel API]   Query: ${JSON.stringify(req.query)}`);

    // Call the serverless handler
    return handler(req, res);
  } catch (error) {
    console.error("[Vercel API] Critical error:", error);
    res.status(502).json({
      success: false,
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
