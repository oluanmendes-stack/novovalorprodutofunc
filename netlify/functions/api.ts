import serverless from "serverless-http";

import { createServer } from "../../server";

let app: any;
let serverlessHandler: any;

export const handler = async (event: any, context: any) => {
  try {
    if (!app) {
      console.log("[Netlify Function] Initializing Express app...");
      app = await createServer();
      serverlessHandler = serverless(app);
      console.log("[Netlify Function] Express app and serverless handler initialized.");
    }

    console.log(`[Netlify Function] Request: ${event.httpMethod} ${event.path}`);
    
    // Ensure we await the serverless handler
    const response = await serverlessHandler(event, context);
    console.log(`[Netlify Function] Response status: ${response.statusCode}`);
    
    return response;
  } catch (error) {
    console.error("[Netlify Function] CRITICAL ERROR:", error);
    return {
      statusCode: 502,
      body: JSON.stringify({
        success: false,
        error: "Internal Server Error (Function Crash)",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    };
  }
};
