import React, { useState } from 'react';

export const QueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sqlResult, setSqlResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Implement natural language to SQL conversion
      setSqlResult('SELECT * FROM table'); // Placeholder
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Natural Language SQL Assistant</h1>
      
      <form onSubmit={handleQuerySubmit} className="mb-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your question in natural language..."
          className="w-full p-2 border rounded-md mb-2"
          rows={4}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Converting...' : 'Convert to SQL'}
        </button>
      </form>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {sqlResult && (
        <div className="bg-gray-100 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Generated SQL:</h2>
          <pre className="whitespace-pre-wrap">{sqlResult}</pre>
        </div>
      )}
    </div>
  );
}; 