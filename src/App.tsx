import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryInterface } from './components/QueryInterface';

// Main App component
export const App: React.FC = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<QueryInterface />} />
      </Routes>
    </div>
  );
}; 