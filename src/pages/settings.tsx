import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/global.css';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('general');
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header className="mb-3">
        <h1 className="text-center">MetabaseNL Settings</h1>
        <p className="text-center mb-3">Configure your natural language to SQL assistant</p>
        
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #eee',
          marginBottom: '20px'
        }}>
          <TabButton 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')}
          >
            General
          </TabButton>
          <TabButton 
            active={activeTab === 'llm'} 
            onClick={() => setActiveTab('llm')}
          >
            LLM Providers
          </TabButton>
          <TabButton 
            active={activeTab === 'privacy'} 
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </TabButton>
          <TabButton 
            active={activeTab === 'about'} 
            onClick={() => setActiveTab('about')}
          >
            About
          </TabButton>
        </div>
      </header>
      
      <main>
        {activeTab === 'general' && (
          <div>
            <h2 className="mb-2">General Settings</h2>
            
            <div className="mb-3">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Theme
              </label>
              <select style={{ 
                width: '100%',
                padding: '8px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid #ccc'
              }}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Maximum Query History Items
              </label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                defaultValue="50"
                style={{ 
                  width: '100%',
                  padding: '8px',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            
            <div className="mb-3">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" defaultChecked />
                <span style={{ marginLeft: '8px' }}>Enable query history</span>
              </label>
            </div>
          </div>
        )}
        
        {activeTab === 'llm' && (
          <div>
            <h2 className="mb-2">LLM Provider Settings</h2>
            
            <div className="mb-3">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Primary Provider
              </label>
              <select style={{ 
                width: '100%',
                padding: '8px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid #ccc'
              }}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="local">WebLLM (Local)</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                OpenAI API Key
              </label>
              <input 
                type="password" 
                placeholder="sk-..."
                style={{ 
                  width: '100%',
                  padding: '8px',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            
            <div className="mb-3">
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Anthropic API Key
              </label>
              <input 
                type="password" 
                placeholder="sk-ant-..."
                style={{ 
                  width: '100%',
                  padding: '8px',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid #ccc'
                }}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'privacy' && (
          <div>
            <h2 className="mb-2">Privacy Settings</h2>
            
            <div className="mb-3">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" defaultChecked />
                <span style={{ marginLeft: '8px' }}>Share anonymous usage statistics</span>
              </label>
            </div>
            
            <div className="mb-3">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" defaultChecked />
                <span style={{ marginLeft: '8px' }}>Store queries locally</span>
              </label>
            </div>
            
            <div className="mb-3">
              <button
                style={{
                  background: 'var(--error-color)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer'
                }}
              >
                Clear All Stored Data
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'about' && (
          <div>
            <h2 className="mb-2">About MetabaseNL</h2>
            
            <p className="mb-2">Version: 0.1.0</p>
            <p className="mb-2">
              MetabaseNL is a browser extension that allows non-technical users to generate and execute SQL queries in Metabase using natural language.
            </p>
            
            <h3 className="mb-2 mt-3">Credits</h3>
            <p>
              Made with ❤️ by the MetabaseNL team
            </p>
            
            <h3 className="mb-2 mt-3">License</h3>
            <p>
              MIT License
            </p>
          </div>
        )}
      </main>
      
      <footer className="mt-3 text-center">
        <button 
          style={{
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--border-radius)',
            marginRight: '8px'
          }}
        >
          Save Settings
        </button>
        
        <a href="popup.html" style={{ color: 'var(--primary-color)' }}>
          Back to Extension
        </a>
      </footer>
    </div>
  );
};

// Tab button component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--primary-color)' : '2px solid transparent',
        padding: '8px 16px',
        cursor: 'pointer',
        color: active ? 'var(--primary-color)' : 'inherit',
        fontWeight: active ? 'bold' : 'normal'
      }}
    >
      {children}
    </button>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Settings />
  </React.StrictMode>
); 