import { RequestHandler } from "express";

export interface PathConfig {
  pricePdfPath: string;
  descritivesFolderPath: string;
  imagesFolderPath: string;
  catalogTemplatePath: string;
}

// In-memory storage - in production, use a database or file system
let currentConfig: PathConfig = {
  pricePdfPath: "",
  descritivesFolderPath: "",
  imagesFolderPath: "",
  catalogTemplatePath: "",
};

/**
 * Get current configuration
 */
export const getConfig: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: currentConfig,
    });
  } catch (error) {
    console.error("Error fetching config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch configuration",
    });
  }
};

/**
 * Save configuration
 */
export const saveConfig: RequestHandler = (req, res) => {
  try {
    const config = req.body as Partial<PathConfig>;

    // Validate input
    if (!config) {
      res.status(400).json({
        success: false,
        error: "Configuration data required",
      });
      return;
    }

    // Update config (merge with existing)
    currentConfig = {
      ...currentConfig,
      ...config,
    };

    // In production, persist to database or .env file
    // Example: saveToEnvFile(currentConfig)

    res.json({
      success: true,
      data: currentConfig,
      message: "Configuration saved successfully",
    });
  } catch (error) {
    console.error("Error saving config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save configuration",
    });
  }
};

/**
 * Validate configuration paths
 */
export const validateConfig: RequestHandler = (req, res) => {
  try {
    const { paths } = req.body;

    if (!paths || typeof paths !== "object") {
      res.status(400).json({
        success: false,
        error: "Paths object required",
      });
      return;
    }

    // In production, check if files/folders exist
    // Example: const exists = fs.existsSync(path);

    const validation = {
      pricePdfPath: !!paths.pricePdfPath,
      descritivesFolderPath: !!paths.descritivesFolderPath,
      imagesFolderPath: !!paths.imagesFolderPath,
      catalogTemplatePath: !!paths.catalogTemplatePath,
    };

    const allValid = Object.values(validation).every((v) => v);

    res.json({
      success: true,
      data: validation,
      allValid,
    });
  } catch (error) {
    console.error("Error validating config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate configuration",
    });
  }
};
