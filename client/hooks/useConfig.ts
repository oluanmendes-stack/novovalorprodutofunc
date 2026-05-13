import { useState, useEffect } from "react";

export interface PathConfig {
  pricePdfPath: string;
  descritivesFolderPath: string;
  imagesFolderPath: string;
  catalogTemplatePath: string;
}

export function useConfig() {
  const [config, setConfig] = useState<PathConfig>({
    pricePdfPath: "",
    descritivesFolderPath: "",
    imagesFolderPath: "",
    catalogTemplatePath: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("pathConfig");
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Error parsing saved config:", e);
      }
    }
    setLoading(false);
  }, []);

  const saveConfig = async (newConfig: PathConfig) => {
    try {
      // Save to localStorage
      localStorage.setItem("pathConfig", JSON.stringify(newConfig));

      // In production, also save to backend
      // const response = await fetch('/api/config/save', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newConfig)
      // });

      setConfig(newConfig);
      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error saving config:", err);
      return false;
    }
  };

  const validateConfig = async () => {
    // Config validation via API is not available in the deployed version
    // Configuration is stored in localStorage only
    console.info("Config validation via API is not available in production");
    return null;
  };

  return {
    config,
    loading,
    error,
    saveConfig,
    validateConfig,
    isConfigured:
      !!(
        config.pricePdfPath &&
        config.descritivesFolderPath &&
        config.imagesFolderPath
      ) || localStorage.getItem("pathConfig") !== null,
  };
}
