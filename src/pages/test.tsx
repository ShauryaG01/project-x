import React from 'react';
import { Button } from '../components/core/Button';
import { Input } from '../components/core/Input';
import { Tooltip } from '../components/core/Tooltip';
import { LoadingIndicator } from '../components/core/LoadingIndicator';
import { ErrorMessage } from '../components/core/ErrorMessage';
import { QueryInput } from '../components/features/QueryInput';
import { ResultsDisplay } from '../components/features/ResultsDisplay';

export const TestPage: React.FC = () => {
  const [showError, setShowError] = React.useState(false);
  const [showLoading, setShowLoading] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Component Test Page</h1>

        {/* Core Components Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Core Components</h2>
          
          <div className="space-y-4">
            {/* Buttons */}
            <div>
              <h3 className="text-lg font-medium mb-2">Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button isLoading>Loading</Button>
                <Button leftIcon={<span>←</span>}>With Icon</Button>
              </div>
            </div>

            {/* Inputs */}
            <div>
              <h3 className="text-lg font-medium mb-2">Inputs</h3>
              <div className="space-y-2">
                <Input placeholder="Default input" />
                <Input
                  label="With label"
                  placeholder="Input with label"
                  helperText="This is a helper text"
                />
                <Input
                  error="This is an error"
                  placeholder="Input with error"
                />
                <Input
                  leftIcon={<span>🔍</span>}
                  placeholder="Input with left icon"
                />
              </div>
            </div>

            {/* Tooltips */}
            <div>
              <h3 className="text-lg font-medium mb-2">Tooltips</h3>
              <div className="flex gap-4">
                <Tooltip content="Top tooltip" position="top">
                  <Button>Hover me (Top)</Button>
                </Tooltip>
                <Tooltip content="Right tooltip" position="right">
                  <Button>Hover me (Right)</Button>
                </Tooltip>
                <Tooltip content="Bottom tooltip" position="bottom">
                  <Button>Hover me (Bottom)</Button>
                </Tooltip>
                <Tooltip content="Left tooltip" position="left">
                  <Button>Hover me (Left)</Button>
                </Tooltip>
              </div>
            </div>

            {/* Loading Indicator */}
            <div>
              <h3 className="text-lg font-medium mb-2">Loading Indicator</h3>
              <div className="flex gap-4">
                <LoadingIndicator size="sm" />
                <LoadingIndicator size="md" />
                <LoadingIndicator size="lg" />
                <LoadingIndicator variant="secondary" />
                <LoadingIndicator variant="white" />
              </div>
            </div>

            {/* Error Message */}
            <div>
              <h3 className="text-lg font-medium mb-2">Error Message</h3>
              <div className="space-y-2">
                <ErrorMessage
                  message="This is an error message"
                  variant="error"
                  onDismiss={() => setShowError(false)}
                />
                <ErrorMessage
                  message="This is a warning message"
                  variant="warning"
                />
                <ErrorMessage
                  message="This is an info message"
                  variant="info"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Components Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Feature Components</h2>
          
          <div className="space-y-8">
            {/* Query Input */}
            <div>
              <h3 className="text-lg font-medium mb-2">Query Input</h3>
              <QueryInput />
            </div>

            {/* Results Display */}
            <div>
              <h3 className="text-lg font-medium mb-2">Results Display</h3>
              <ResultsDisplay />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}; 