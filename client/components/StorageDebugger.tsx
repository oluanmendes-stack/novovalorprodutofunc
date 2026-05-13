import { useState } from 'react';
import { useSupabaseDebug } from '@/hooks/useSupabaseDebug';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FolderOpen, File, ChevronRight } from 'lucide-react';

export default function StorageDebugger() {
  const [currentPath, setCurrentPath] = useState('MED-LINKET');
  const [pathHistory, setPathHistory] = useState<string[]>(['MED-LINKET']);
  const { loading, results, error, listFolder } = useSupabaseDebug();

  const handleNavigate = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setPathHistory([...pathHistory, newPath]);
    setCurrentPath(newPath);
    listFolder(newPath);
  };

  const handleBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1);
      const prevPath = newHistory[newHistory.length - 1];
      setPathHistory(newHistory);
      setCurrentPath(prevPath);
      listFolder(prevPath);
    }
  };

  const handleRoot = () => {
    setPathHistory(['MED-LINKET']);
    setCurrentPath('MED-LINKET');
    listFolder('MED-LINKET');
  };

  return (
    <Card className="p-4 bg-amber-50 border-amber-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Supabase Storage Explorer</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Navigate through MED-LINKET folder to find your images
            </p>
          </div>
        </div>

        {/* Breadcrumb/Path */}
        <div className="flex items-center gap-1 text-xs bg-white p-2 rounded border overflow-x-auto">
          <button
            onClick={handleRoot}
            className="px-2 py-1 hover:bg-gray-100 rounded whitespace-nowrap"
          >
            imagens
          </button>
          {currentPath.split('/').map((part, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="whitespace-nowrap">{part}</span>
            </span>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={() => listFolder(currentPath)}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            onClick={handleBack}
            disabled={pathHistory.length <= 1}
            size="sm"
            variant="outline"
          >
            ← Back
          </Button>
        </div>

        {/* Results */}
        {error && (
          <div className="p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {!error && results.length === 0 && !loading && (
          <div className="p-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
            Folder is empty or not found
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {results.map((item) => (
              <div
                key={item.path}
                className="flex items-center gap-2 p-2 hover:bg-white rounded text-xs cursor-pointer transition"
                onClick={() => item.isFolder && handleNavigate(item.name)}
              >
                {item.isFolder ? (
                  <>
                    <FolderOpen className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <span className="font-medium text-gray-700 flex-1 truncate">
                      📁 {item.name}
                    </span>
                    <span className="text-gray-400">→</span>
                  </>
                ) : (
                  <>
                    <File className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700 flex-1 truncate">
                      📄 {item.name}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="text-xs text-gray-500 p-2 bg-white rounded border">
            Found {results.filter(r => r.isFolder).length} folders and{' '}
            {results.filter(r => !r.isFolder).length} files
          </div>
        )}
      </div>
    </Card>
  );
}
