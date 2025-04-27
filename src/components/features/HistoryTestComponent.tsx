/**
 * History Test Component
 * 
 * A simple component to demonstrate and test the query history functionality
 */

import React, { useState } from 'react';
import { useQueryHistory } from '../../hooks/useQueryHistory';
import { HistoryProvider } from '../../store/history';

// Wrapper component that provides history context
export function HistoryTestWrapper() {
  const historyTest = React.createElement(HistoryTest, {});
  return React.createElement(HistoryProvider, { children: historyTest });
}

// Main test component that uses the history hook
function HistoryTest() {
  const history = useQueryHistory();
  const [question, setQuestion] = useState('');
  const [sql, setSql] = useState('');
  const [databaseId, setDatabaseId] = useState('default');

  // Handle form submission to save a new query
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !sql) return;
    
    try {
      await history.add({
        question,
        sql,
        databaseId,
      });
      
      // Clear form
      setQuestion('');
      setSql('');
    } catch (error) {
      console.error('Failed to save query:', error);
    }
  };

  // Handle starring a query
  const handleStar = async (id: string, isStarred: boolean) => {
    try {
      await history.star(id, !isStarred);
    } catch (error) {
      console.error('Failed to star query:', error);
    }
  };

  // Handle deleting a query
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this query?')) {
      try {
        await history.delete(id);
      } catch (error) {
        console.error('Failed to delete query:', error);
      }
    }
  };

  // Create form elements
  const formLabel = (text: string, element: React.ReactNode) => 
    React.createElement('label', {}, text, element);
  
  const formInput = (props: any) => 
    React.createElement('input', props);
  
  const formTextarea = (props: any) => 
    React.createElement('textarea', props);
  
  const formDiv = (children: React.ReactNode) => 
    React.createElement('div', {}, children);
  
  const formButton = (text: string, props?: any) => 
    React.createElement('button', props, text);

  // Create form
  const form = React.createElement(
    'form', 
    { onSubmit: handleSubmit },
    formDiv(
      formLabel(
        'Question: ',
        formInput({
          type: 'text',
          value: question,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value),
          placeholder: 'Enter a natural language question',
          required: true
        })
      )
    ),
    formDiv(
      formLabel(
        'SQL: ',
        formTextarea({
          value: sql,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setSql(e.target.value),
          placeholder: 'Enter SQL query',
          required: true
        })
      )
    ),
    formDiv(
      formLabel(
        'Database ID: ',
        formInput({
          type: 'text',
          value: databaseId,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDatabaseId(e.target.value),
          placeholder: 'Enter database ID'
        })
      )
    ),
    formButton('Save Query', { type: 'submit' })
  );

  // Create query list
  const createQueryList = () => {
    if (history.loading) {
      return React.createElement('p', {}, 'Loading...');
    }
    
    if (history.queries.length === 0) {
      return React.createElement('p', {}, 'No queries yet. Add one above!');
    }
    
    const queryItems = history.filteredQueries.map(query => {
      return React.createElement(
        'li',
        { key: query.id },
        React.createElement('h3', {}, query.question),
        React.createElement('pre', {}, query.sql),
        React.createElement(
          'div',
          {},
          React.createElement(
            'small',
            {},
            new Date(query.timestamp).toLocaleString(),
            ' | Database: ',
            query.databaseId
          )
        ),
        React.createElement(
          'div',
          {},
          formButton(
            query.isStarred ? '★ Unstar' : '☆ Star',
            { onClick: () => handleStar(query.id, !!query.isStarred) }
          ),
          formButton('Delete', { onClick: () => handleDelete(query.id) })
        )
      );
    });
    
    return React.createElement('ul', {}, ...queryItems);
  };

  // Create clear button
  const clearButton = history.queries.length > 0
    ? formButton('Clear All', { onClick: () => history.clearAll() })
    : null;

  // Return the main component
  return React.createElement(
    'div',
    { className: 'history-test' },
    React.createElement('h1', {}, 'Query History Test'),
    form,
    React.createElement(
      'div',
      {},
      React.createElement('h2', {}, 'Recent Queries'),
      createQueryList(),
      clearButton
    )
  );
} 