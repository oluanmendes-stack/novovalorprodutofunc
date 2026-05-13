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

    // Log full event details for debugging
    console.log(`[Netlify Function] Request: ${event.httpMethod} ${event.path}`);
    if (event.rawPath) {
      console.log(`[Netlify Function]   rawPath: ${event.rawPath}`);
    }
    if (event.requestContext?.path) {
      console.log(`[Netlify Function]   requestContext.path: ${event.requestContext.path}`);
    }
    console.log(`[Netlify Function]   queryStringParameters: ${JSON.stringify(event.queryStringParameters)}`);

    // Ensure we await the serverless handler
    const response = await serverlessHandler(event, context);
    console.log(`[Netlify Function] Response status: ${response.statusCode}`);

    return response;
  } catch (error) {
    console.error("[Netlify Function] CRITICAL ERROR:", error);
    console.error("[Netlify Function] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      statusCode: 502,
      body: JSON.stringify({
        success: false,
        error: "Internal Server Error (Function Crash)",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};
