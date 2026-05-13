import * as fs from "fs";
import * as path from "path";

/**
 * Configuration for GitHub raw files fallback
 */
const GITHUB_CONFIG = {
  owner: "oluanmendes-stack",
  repo: "valorproduto7",
  branch: "main",
};

/**
 * Build GitHub raw URL for a file path
 */
export function buildGitHubRawUrl(filePath: string): string {
  // Remove leading slashes and normalize path
  const normalizedPath = filePath.replace(/^\/+/, "").replace(/\\/g, "/");
  return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${normalizedPath}`;
}

/**
 * Check if a local file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Read file from local filesystem
 */
export function readFileLocal(filePath: string): Buffer | null {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error(`[FileResolver] Error reading local file: ${filePath}`, error);
    return null;
  }
}

/**
 * Create read stream for a local file
 */
export function createReadStreamLocal(filePath: string): fs.ReadStream | null {
  try {
    return fs.createReadStream(filePath);
  } catch (error) {
    console.error(`[FileResolver] Error creating stream for local file: ${filePath}`, error);
    return null;
  }
}

/**
 * Fetch file from GitHub raw URL
 */
export async function fetchFileFromGitHub(relativeFilePath: string): Promise<Buffer | null> {
  try {
    const url = buildGitHubRawUrl(relativeFilePath);
    console.log(`[FileResolver] Fetching from GitHub: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[FileResolver] GitHub fetch failed with status ${response.status}: ${url}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`[FileResolver] Error fetching from GitHub:`, error);
    return null;
  }
}

/**
 * Resolve file with fallback: local first, then GitHub
 * Returns the file buffer or null if not found
 */
export async function resolveFilePath(
  localPath: string,
  gitHubRelativePath?: string,
  options?: { logNotFound?: boolean }
): Promise<Buffer | null> {
  const { logNotFound = true } = options || {};

  // Try local file first
  if (fileExists(localPath)) {
    console.log(`[FileResolver] File found locally: ${localPath}`);
    const content = readFileLocal(localPath);
    if (content) {
      return content;
    }
  }

  // Try GitHub as fallback
  const gitHubPath = gitHubRelativePath || localPath;
  const buffer = await fetchFileFromGitHub(gitHubPath);

  if (buffer) {
    console.log(`[FileResolver] File resolved from GitHub: ${gitHubPath}`);
    return buffer;
  }

  if (logNotFound) {
    console.warn(`[FileResolver] File not found locally or on GitHub: ${localPath}`);
  }

  return null;
}

/**
 * Create a readable stream for a file with fallback
 * This is useful for streaming responses
 */
export async function createReadStream(
  localPath: string,
  gitHubRelativePath?: string
): Promise<{ stream: NodeJS.ReadableStream | null; source: "local" | "github" | null }> {
  const gitHubPath = gitHubRelativePath || localPath;

  // Try local file first
  if (fileExists(localPath)) {
    const stream = createReadStreamLocal(localPath);
    if (stream) {
      return { stream, source: "local" };
    }
  }

  // Try GitHub as fallback
  try {
    const url = buildGitHubRawUrl(gitHubPath);
    const response = await fetch(url);

    if (!response.ok) {
      return { stream: null, source: null };
    }

    // Convert fetch response body to Node stream
    // @ts-ignore - ReadableStream from fetch is compatible
    return { stream: response.body, source: "github" };
  } catch (error) {
    console.error(`[FileResolver] Error creating stream from GitHub:`, error);
    return { stream: null, source: null };
  }
}
