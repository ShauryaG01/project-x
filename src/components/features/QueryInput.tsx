import React, { useRef, useEffect } from 'react';
import { Input } from '../core/Input';
import { Button } from '../core/Button';
import { LoadingIndicator } from '../core/LoadingIndicator';
import { ErrorMessage } from '../core/ErrorMessage';
import { useQueryProcessor } from '../../hooks/useQueryProcessor';

export interface QueryInputProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export const QueryInput: React.FC<QueryInputProps> = ({
  className,
  placeholder = 'Enter your question in natural language...',
  autoFocus = false
}) => {
  const {
    query,
    isLoading,
    error,
    handleQueryChange,
    handleProcess,
    handleClear
  } = useQueryProcessor();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize functionality
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcess();
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full min-h-[100px] p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={1}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {query && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              leftIcon={
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Clear
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleProcess()}
            isLoading={isLoading}
            disabled={!query || isLoading}
            leftIcon={
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            {isLoading ? 'Processing...' : 'Ask'}
          </Button>
        </div>
      </div>
      {error && (
        <ErrorMessage
          message={error}
          variant="error"
          className="mt-2"
        />
      )}
    </div>
  );
}; 