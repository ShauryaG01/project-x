import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';

const Popup: React.FC = () => {
  return (
    <div className="popup-container">
      <header className="mb-2">
        <h1 className="text-center">MetabaseNL</h1>
        <p className="text-center">Natural language to SQL for Metabase</p>
      </header>
      
      <main>
        <div className="mb-3">
          <p>Type your question in natural language:</p>
          <textarea 
            placeholder="e.g., Show me the top 10 customers by revenue in the last month"
            rows={4}
            style={{ 
              width: '100%', 
              padding: '8px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid #ccc',
              resize: 'vertical'  
            }}
          />
          <button 
            style={{
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--border-radius)',
              marginTop: '8px',
              width: '100%'
            }}
          >
            Generate SQL
          </button>
        </div>
        
        <div>
          <p className="mb-1">Results will appear here</p>
          <div 
            style={{
              border: '1px solid #eee',
              borderRadius: 'var(--border-radius)',
              padding: '16px',
              minHeight: '200px',
              background: '#f9f9f9'
            }}
          >
            <p className="text-center">No results yet. Ask a question to get started.</p>
          </div>
        </div>
      </main>
      
      <footer className="mt-3 text-center">
        <a href="settings.html" target="_blank" style={{ color: 'var(--primary-color)' }}>
          Settings
        </a>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
); 