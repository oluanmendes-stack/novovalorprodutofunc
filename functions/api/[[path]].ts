/// <reference types="@cloudflare/workers-types" />
import serverless from "serverless-http";
import { createServer } from "../../server/index";

let app: any;

/**
 * Catch-all handler for all /api/* routes on Cloudflare Pages
 */
export const onRequest: PagesFunction<{ 
  SUPABASE_URL: string; 
  SUPABASE_KEY: string; 
}> = async (context) => {
  try {
    // Inject environment variables into process.env BEFORE initializing the app
    if (context.env) {
      Object.entries(context.env).forEach(([key, value]) => {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      });
    }

    if (!app) {
      console.log("[Cloudflare] Initializing Express app...");
      app = await createServer();
      console.log("[Cloudflare] Express app initialized.");
    }

    // serverless-http 3.2.0 supports Cloudflare Workers / Fetch API
    const slsHandler = serverless(app);

    // Proxy the request to allow serverless-http to set properties (Cloudflare Request is read-only)
    // We add deep stubs to satisfy various serverless-http detection paths (AWS, Azure, etc.)
    const requestProxy = new Proxy(context.request, {
      get: (target, prop) => {
        if (prop === "requestContext") {
          return {
            identity: { sourceIp: "127.0.0.1" },
            http: { sourceIp: "127.0.0.1" },
            elb: false
          };
        }
        if (prop === "httpMethod") return target.method;
        
        const value = (target as any)[prop];
        return typeof value === "function" ? value.bind(target) : value;
      },
      set: (target, prop, value) => {
        // Silently swallow assignments to read-only properties to prevent crashes
        return true;
      }
    });

    // Execute the handler - pass the request and minimal context
    const response = await (slsHandler as any)(requestProxy, context.env, context);
    
    // Add some headers if needed
    console.log(`[Cloudflare] Request: ${context.request.method} ${context.request.url} -> Status: ${response.status}`);
    
    return response as Response;
  } catch (error: any) {
    console.error("[Cloudflare] CRITICAL ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    return new Response(JSON.stringify({
      success: false,
      error: `Cloudflare Function Error: ${errorMessage}`,
      details: errorMessage,
      stack: errorStack,
      env_keys: context.env ? Object.keys(context.env) : []
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
