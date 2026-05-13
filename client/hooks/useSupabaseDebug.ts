import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface StorageItem {
  name: string;
  isFolder: boolean;
  path: string;
}

export function useSupabaseDebug() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StorageItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const listFolder = useCallback(async (folderPath: string) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      console.log(`[useSupabaseDebug] Listing folder: "${folderPath}"`);
      const { data, error: err } = await supabase.storage
        .from('imagens')
        .list(folderPath, { limit: 1000 });

      if (err) {
        setError(`Error: ${err.message}`);
        console.error('Error listing folder:', err);
        return;
      }

      if (!data || data.length === 0) {
        setResults([]);
        console.log(`[useSupabaseDebug] Folder is empty`);
        return;
      }

      const items: StorageItem[] = data.map(item => ({
        name: item.name,
        isFolder: !item.id, // In Supabase, id is null for folders
        path: folderPath ? `${folderPath}/${item.name}` : item.name,
      }));

      setResults(items);
      console.log(`[useSupabaseDebug] Found ${items.length} items:`, items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    results,
    error,
    listFolder,
  };
}
