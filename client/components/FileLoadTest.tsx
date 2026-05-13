import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FileTestResult {
  url: string;
  status: 'testing' | 'success' | 'error';
  message?: string;
}

export default function FileLoadTest() {
  const [results, setResults] = useState<FileTestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const testFiles = [
    {
      name: 'ODM-DE0062B.jpg (Image)',
      url: 'https://xlulghxjzkjlxkvpcbrr.supabase.co/storage/v1/object/public/imagens/MED-LINKET/ELETRODO%20DESFIBRILA%20O/ODM-DE0062B.jpg'
    },
    {
      name: 'ODM-DE0062C.doc (Catalog)',
      url: 'https://xlulghxjzkjlxkvpcbrr.supabase.co/storage/v1/object/public/catalogo/ODM-DE0062C.doc'
    }
  ];

  const testFileAccess = async () => {
    setTesting(true);
    const newResults: FileTestResult[] = [];

    for (const file of testFiles) {
      newResults.push({
        url: file.name,
        status: 'testing',
        message: 'Testing...'
      });
      setResults([...newResults]);

      try {
        const response = await fetch(file.url, { method: 'HEAD' });
        newResults[newResults.length - 1] = {
          url: file.name,
          status: response.ok ? 'success' : 'error',
          message: response.ok ? `Status: ${response.status}` : `HTTP ${response.status}: ${response.statusText}`
        };
      } catch (error) {
        newResults[newResults.length - 1] = {
          url: file.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      setResults([...newResults]);
    }

    setTesting(false);
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-sm">File Access Test</h3>
          <p className="text-xs text-muted-foreground mt-1">Test if the files you provided are accessible:</p>
        </div>

        <Button 
          onClick={testFileAccess} 
          disabled={testing}
          size="sm"
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Files'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded border">
                <div className="flex-shrink-0 mt-0.5">
                  {result.status === 'testing' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {result.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{result.url}</p>
                  <p className="text-xs text-muted-foreground">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
