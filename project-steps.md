# Implementation Plan

## Project Setup & Configuration

- [ ] Step 1: Create Project Structure and Initial Configuration
  - **Task**: Set up the base project structure including directories, TypeScript configuration, build system, and extension manifest
  - **Files**:
    - `manifest.json`: Create the Chrome extension manifest file (MV3)
    - `package.json`: Configure dependencies and scripts
    - `tsconfig.json`: Set up TypeScript configuration
    - `vite.config.ts`: Configure Vite for extension building
    - `.eslintrc.js`: Set up linting rules
    - `.env.example`: Template for environment variables
    - `README.md`: Basic project documentation
  - **Step Dependencies**: None
  - **User Instructions**: Run `npm install` after these files are created to install dependencies

- [ ] Step 2: Configure Extension Entry Points
  - **Task**: Create the foundation of the extension's core files, including popup, settings page, background script, and content script
  - **Files**:
    - `src/pages/popup.tsx`: Create basic popup page
    - `src/pages/settings.tsx`: Create basic settings page
    - `src/background/index.ts`: Set up service worker background script
    - `src/content-scripts/metabase.ts`: Create initial content script for Metabase
    - `public/popup.html`: HTML wrapper for popup
    - `public/settings.html`: HTML wrapper for settings page
    - `src/styles/global.css`: Global CSS styles
  - **Step Dependencies**: Step 1
  - **User Instructions**: None

## Storage Layer

- [ ] Step 3: Implement IndexedDB Storage Layer
  - **Task**: Create the storage layer for query history, schema cache, and user settings using IndexedDB
  - **Files**:
    - `src/lib/storage/db.ts`: Core IndexedDB initialization and management
    - `src/lib/storage/history.ts`: Query history storage operations
    - `src/lib/storage/schema.ts`: Schema cache storage operations
    - `src/lib/storage/settings.ts`: User settings storage operations
    - `src/types/storage.ts`: TypeScript interfaces for storage
  - **Step Dependencies**: Step 1
  - **User Instructions**: None

- [ ] Step 4: Implement Query History Management
  - **Task**: Create functionality to save, retrieve, and manage query history
  - **Files**:
    - `src/lib/storage/history.ts`: Enhance with CRUD operations
    - `src/store/history.ts`: State management for history
    - `src/hooks/useQueryHistory.ts`: React hook for history operations
    - `src/types/history.ts`: TypeScript interfaces for history
  - **Step Dependencies**: Step 3
  - **User Instructions**: None

- [ ] Step 5: Implement Settings Management
  - **Task**: Create functionality to save and retrieve user settings
  - **Files**:
    - `src/store/settings.ts`: State management for settings
    - `src/hooks/useSettings.ts`: React hook for settings operations
    - `src/types/settings.ts`: TypeScript interfaces for settings
    - `src/constants/defaultSettings.ts`: Default settings values
  - **Step Dependencies**: Step 3
  - **User Instructions**: None

## Metabase DOM Adapter

- [ ] Step 6: Create Metabase DOM Detection and Fingerprinting
  - **Task**: Implement logic to detect Metabase in the current page and identify UI elements
  - **Files**:
    - `src/lib/adapters/adapter.ts`: Base adapter interface
    - `src/lib/adapters/registry.ts`: Adapter registry
    - `src/lib/adapters/metabase/detector.ts`: Metabase detection logic
    - `src/lib/adapters/metabase/selectors.ts`: DOM selectors for Metabase
    - `src/types/adapters.ts`: TypeScript interfaces for adapters
  - **Step Dependencies**: Step 2
  - **User Instructions**: None

- [ ] Step 7: Implement Metabase SQL Injection
  - **Task**: Create functionality to inject SQL into Metabase's editor and trigger execution
  - **Files**:
    - `src/lib/adapters/metabase/executor.ts`: SQL injection and execution
    - `src/lib/adapters/metabase/index.ts`: Main adapter integration
    - `src/content-scripts/metabase.ts`: Update content script to use executor
  - **Step Dependencies**: Step 6
  - **User Instructions**: None

- [ ] Step 8: Implement Result Extraction from Metabase
  - **Task**: Create functionality to extract query results from Metabase's UI
  - **Files**:
    - `src/lib/adapters/metabase/results.ts`: Results extraction logic
    - `src/lib/adapters/metabase/index.ts`: Update main adapter
    - `src/types/results.ts`: TypeScript interfaces for results
  - **Step Dependencies**: Step 7
  - **User Instructions**: None

## LLM Integration

- [ ] Step 9: Create LLM Provider Interface and Router
  - **Task**: Implement the base interface for LLM providers and the router to manage them
  - **Files**:
    - `src/lib/llm/types.ts`: TypeScript interfaces for LLM providers
    - `src/lib/llm/router.ts`: Multi-provider router implementation
    - `src/lib/llm/index.ts`: LLM module main entry point
    - `src/hooks/useLLM.ts`: React hook for LLM operations
  - **Step Dependencies**: Step 5
  - **User Instructions**: None

- [ ] Step 10: Implement OpenAI Provider
  - **Task**: Create integration with OpenAI API for query generation
  - **Files**:
    - `src/lib/llm/providers/openai.ts`: OpenAI provider implementation
    - `src/lib/llm/prompts/openai.ts`: OpenAI-specific prompts
    - `src/constants/llm.ts`: LLM-related constants
  - **Step Dependencies**: Step 9
  - **User Instructions**: None

- [ ] Step 11: Implement Anthropic Provider
  - **Task**: Create integration with Anthropic API for query generation
  - **Files**:
    - `src/lib/llm/providers/anthropic.ts`: Anthropic provider implementation
    - `src/lib/llm/prompts/anthropic.ts`: Anthropic-specific prompts
  - **Step Dependencies**: Step 9
  - **User Instructions**: None

- [ ] Step 12: Implement WebLLM.js Local Provider
  - **Task**: Create integration with WebLLM.js for local model fallback
  - **Files**:
    - `src/lib/llm/providers/webllm.ts`: WebLLM provider implementation
    - `src/lib/llm/prompts/webllm.ts`: WebLLM-specific prompts
  - **Step Dependencies**: Step 9
  - **User Instructions**: None

## Schema Management

- [ ] Step 13: Create Schema Extraction Logic
  - **Task**: Implement functionality to extract schema information from Metabase
  - **Files**:
    - `src/lib/schema/parser.ts`: Schema extraction logic
    - `src/lib/schema/types.ts`: TypeScript interfaces for schema
    - `src/lib/adapters/metabase/schema.ts`: Metabase-specific schema extraction
  - **Step Dependencies**: Step 8
  - **User Instructions**: None

- [ ] Step 14: Implement Progressive Schema Builder
  - **Task**: Create system to progressively build and improve schema understanding
  - **Files**:
    - `src/lib/schema/builder.ts`: Progressive schema building logic
    - `src/lib/schema/compressor.ts`: Schema optimization for context limits
    - `src/store/schema.ts`: State management for schema
    - `src/hooks/useSchema.ts`: React hook for schema operations
  - **Step Dependencies**: Step 13
  - **User Instructions**: None

## SQL Processing

- [ ] Step 15: Implement SQL Validation and Formatting
  - **Task**: Create functionality to validate, format, and secure SQL queries
  - **Files**:
    - `src/lib/sql/validator.ts`: SQL security validation
    - `src/lib/sql/formatter.ts`: SQL formatting
    - `src/lib/sql/templates/index.ts`: SQL template library
    - `src/types/sql.ts`: TypeScript interfaces for SQL
  - **Step Dependencies**: Step 10, Step 11
  - **User Instructions**: None

- [ ] Step 16: Create Natural Language to SQL Pipeline
  - **Task**: Implement the core query processing pipeline
  - **Files**:
    - `src/lib/query/processor.ts`: Query processing orchestration
    - `src/store/query.ts`: State management for queries
    - `src/hooks/useQueryProcessor.ts`: React hook for query processing
    - `src/types/query.ts`: TypeScript interfaces for queries
  - **Step Dependencies**: Step 14, Step 15
  - **User Instructions**: None

## UI Components - Core

- [ ] Step 17: Implement Core UI Components
  - **Task**: Create reusable UI components for the extension
  - **Files**:
    - `src/components/core/Button.tsx`: Button component
    - `src/components/core/Input.tsx`: Input component
    - `src/components/core/Tooltip.tsx`: Tooltip component
    - `src/components/core/LoadingIndicator.tsx`: Loading indicator
    - `src/components/core/ErrorMessage.tsx`: Error message component
    - `src/styles/components.css`: Component styling
  - **Step Dependencies**: Step 2
  - **User Instructions**: None

- [ ] Step 18: Implement Query Input Component
  - **Task**: Create the natural language query input component
  - **Files**:
    - `src/components/features/QueryInput.tsx`: Query input component
    - `src/hooks/useAutoResizeTextarea.ts`: Auto-resize functionality
    - `src/components/features/QuerySuggestions.tsx`: Query suggestions panel
  - **Step Dependencies**: Step 17
  - **User Instructions**: None

- [ ] Step 19: Implement Results Display Component
  - **Task**: Create the component to display query results
  - **Files**:
    - `src/components/features/ResultsDisplay.tsx`: Results display component
    - `src/components/features/DataTable.tsx`: Data table component
    - `src/hooks/useSortableTable.ts`: Table sorting functionality
  - **Step Dependencies**: Step 17
  - **User Instructions**: None

## Error Handling

- [ ] Step 20: Implement Error Classification and Handling
  - **Task**: Create error handling system with classification and recovery options
  - **Files**:
    - `src/lib/errors/types.ts`: Error type definitions
    - `src/lib/errors/handler.ts`: Error handling logic
    - `src/lib/errors/recovery.ts`: Error recovery logic
    - `src/store/errors.ts`: State management for errors
    - `src/hooks/useErrorHandler.ts`: React hook for error handling
  - **Step Dependencies**: Step 16
  - **User Instructions**: None

- [ ] Step 21: Implement LLM-Based Error Recovery
  - **Task**: Create functionality to use LLM for query correction
  - **Files**:
    - `src/lib/errors/llm-recovery.ts`: LLM-based error recovery
    - `src/lib/llm/prompts/error-recovery.ts`: Error recovery prompts
  - **Step Dependencies**: Step 20
  - **User Instructions**: None

## Feature Implementation - Main UI

- [ ] Step 22: Build Popup Main Interface
  - **Task**: Create the main popup interface combining core components
  - **Files**:
    - `src/pages/popup.tsx`: Update popup page
    - `src/components/layout/PopupLayout.tsx`: Popup layout component
    - `src/components/features/QueryContainer.tsx`: Container for query input and results
    - `src/styles/popup.css`: Popup-specific styling
  - **Step Dependencies**: Step 18, Step 19
  - **User Instructions**: None

- [ ] Step 23: Implement Query History UI
  - **Task**: Create the interface for browsing and managing query history
  - **Files**:
    - `src/components/features/HistoryBrowser.tsx`: History browser component
    - `src/components/features/HistoryItem.tsx`: History item component
    - `src/hooks/useHistoryFilters.ts`: History filtering hook
  - **Step Dependencies**: Step 4, Step 22
  - **User Instructions**: None

- [ ] Step 24: Implement Settings UI
  - **Task**: Create the settings interface
  - **Files**:
    - `src/pages/settings.tsx`: Update settings page
    - `src/components/layout/SettingsLayout.tsx`: Settings layout
    - `src/components/features/ProviderSettings.tsx`: LLM provider settings
    - `src/components/features/GeneralSettings.tsx`: General settings
    - `src/components/features/PrivacySettings.tsx`: Privacy settings
    - `src/styles/settings.css`: Settings-specific styling
  - **Step Dependencies**: Step 5, Step 22
  - **User Instructions**: None

## Schema Visualization

- [ ] Step 25: Implement Schema Visualization
  - **Task**: Create components to visualize and manage database schema
  - **Files**:
    - `src/components/features/SchemaVisualizer.tsx`: Schema visualization component
    - `src/components/features/TableDetails.tsx`: Table details component
    - `src/components/features/ColumnList.tsx`: Column list component
    - `src/hooks/useSchemaVisualization.ts`: Schema visualization hook
  - **Step Dependencies**: Step 14, Step 17
  - **User Instructions**: None

- [ ] Step 26: Implement Schema Management UI
  - **Task**: Create interface for managing schema metadata
  - **Files**:
    - `src/components/features/SchemaManager.tsx`: Schema management component
    - `src/components/features/TableEditor.tsx`: Table editing component
    - `src/components/features/RelationshipEditor.tsx`: Relationship editing component
  - **Step Dependencies**: Step 25
  - **User Instructions**: None

## Analytics & Feedback

- [ ] Step 27: Implement Analytics Tracking
  - **Task**: Create system for anonymous usage tracking
  - **Files**:
    - `src/analytics/index.ts`: Analytics main module
    - `src/analytics/posthog.ts`: PostHog integration
    - `src/analytics/events.ts`: Event definitions
    - `src/hooks/useAnalytics.ts`: Analytics hook
  - **Step Dependencies**: Step 5
  - **User Instructions**: Create a PostHog account and add your API key to the .env file

- [ ] Step 28: Implement Feedback Collection
  - **Task**: Create interface and logic for collecting user feedback
  - **Files**:
    - `src/components/features/FeedbackCollector.tsx`: Feedback collection component
    - `src/lib/feedback/index.ts`: Feedback processing logic
    - `src/store/feedback.ts`: State management for feedback
  - **Step Dependencies**: Step 27
  - **User Instructions**: None

## Browser Adaptation

- [ ] Step 29: Implement Browser-Specific Adapters
  - **Task**: Create adapters for different browsers
  - **Files**:
    - `src/browser-adapters/adapter.ts`: Base browser adapter
    - `src/browser-adapters/chrome/index.ts`: Chrome-specific adapter
    - `src/browser-adapters/firefox/index.ts`: Firefox-specific adapter
    - `src/browser-adapters/edge/index.ts`: Edge-specific adapter
    - `src/browser-adapters/safari/index.ts`: Safari-specific adapter
  - **Step Dependencies**: Step 2
  - **User Instructions**: None

## Testing

- [ ] Step 30: Set Up Testing Framework
  - **Task**: Configure and set up testing infrastructure
  - **Files**:
    - `tests/setup.ts`: Test setup file
    - `tests/helpers.ts`: Test helper functions
    - `tests/fixtures/schema.ts`: Schema test fixtures
    - `tests/fixtures/queries.ts`: Query test fixtures
    - `vitest.config.ts`: Vitest configuration
  - **Step Dependencies**: Step 1
  - **User Instructions**: Run `npm test` to verify testing setup

- [ ] Step 31: Implement Unit Tests for Core Modules
  - **Task**: Write unit tests for core functionality
  - **Files**:
    - `tests/unit/storage.test.ts`: Storage tests
    - `tests/unit/llm-router.test.ts`: LLM router tests
    - `tests/unit/sql-validator.test.ts`: SQL validator tests
    - `tests/unit/schema-parser.test.ts`: Schema parser tests
    - `tests/unit/query-processor.test.ts`: Query processor tests
  - **Step Dependencies**: Step 30
  - **User Instructions**: Run `npm test` to execute the tests

- [ ] Step 32: Implement Component Tests
  - **Task**: Write tests for React components
  - **Files**:
    - `tests/component/QueryInput.test.tsx`: Query input tests
    - `tests/component/ResultsDisplay.test.tsx`: Results display tests
    - `tests/component/SchemaVisualizer.test.tsx`: Schema visualizer tests
    - `tests/component/HistoryBrowser.test.tsx`: History browser tests
    - `tests/component/ErrorMessage.test.tsx`: Error message tests
  - **Step Dependencies**: Step 30
  - **User Instructions**: Run `npm test` to execute the tests

- [ ] Step 33: Implement End-to-End Tests
  - **Task**: Write end-to-end tests with Playwright
  - **Files**:
    - `tests/e2e/setup.ts`: E2E test setup
    - `tests/e2e/query-workflow.test.ts`: Query workflow tests
    - `tests/e2e/schema-learning.test.ts`: Schema learning tests
    - `tests/e2e/history-management.test.ts`: History management tests
    - `playwright.config.ts`: Playwright configuration
  - **Step Dependencies**: Step 30
  - **User Instructions**: Install Playwright browsers with `npx playwright install` and run `npm run test:e2e` to execute the tests

## Integration and Finalization

- [ ] Step 34: Implement Complete Query Workflow Integration
  - **Task**: Integrate all components into a complete query workflow
  - **Files**:
    - `src/lib/workflow/index.ts`: Workflow orchestration
    - `src/hooks/useQueryWorkflow.ts`: Workflow hook
    - `src/pages/popup.tsx`: Update with workflow integration
  - **Step Dependencies**: Step 16, Step 21, Step 22
  - **User Instructions**: None

- [ ] Step 35: Implement Security Hardening
  - **Task**: Enhance security features across the extension
  - **Files**:
    - `src/lib/security/sanitizer.ts`: Content sanitization
    - `src/lib/security/validators.ts`: Security validators
    - `src/lib/storage/encryption.ts`: Data encryption utilities
    - `src/lib/security/audit.ts`: Security audit utilities
  - **Step Dependencies**: Step 34
  - **User Instructions**: None

- [ ] Step 36: Implement Documentation and Help
  - **Task**: Create inline help and documentation
  - **Files**:
    - `src/components/features/HelpPanel.tsx`: Help panel component
    - `src/constants/help.ts`: Help content
    - `README.md`: Update with comprehensive documentation
    - `docs/user-guide.md`: User guide
    - `docs/developer-guide.md`: Developer guide
  - **Step Dependencies**: Step 34
  - **User Instructions**: None

- [ ] Step 37: Implement Performance Optimizations
  - **Task**: Optimize performance across the extension
  - **Files**:
    - `src/lib/optimization/caching.ts`: Response caching
    - `src/lib/optimization/tokenization.ts`: Token optimization
    - `src/lib/optimization/worker.ts`: Web Worker implementation for heavy tasks
    - `src/background/optimization.ts`: Background script optimizations
  - **Step Dependencies**: Step 34
  - **User Instructions**: None

- [ ] Step 38: Prepare for Release
  - **Task**: Finalize the extension for release
  - **Files**:
    - `manifest.json`: Update version and finalize manifest
    - `package.json`: Update version
    - `src/constants/version.ts`: Version information
    - `CHANGELOG.md`: Changelog
    - `LICENSE`: License file
  - **Step Dependencies**: All previous steps
  - **User Instructions**: Run `npm run build` to create the production build of the extension

## Summary

This implementation plan breaks down the development of the Browser-side Natural-Language-to-SQL Assistant for Metabase into 38 discrete steps. The plan follows a logical progression:

1. **Foundation First**: We start by setting up the project structure, configuration, and essential infrastructure.

2. **Core Systems**: We then build the fundamental systems like storage, Metabase DOM adaptation, and LLM integration.

3. **Feature Development**: With the foundation in place, we implement the key features: query processing, schema management, UI components, and error handling.

4. **Refinement**: Finally, we add analytics, cross-browser support, testing, and performance optimizations.

Each step is designed to be manageable and focuses on a specific aspect of the application. The steps build upon each other, with clear dependencies that ensure a logical development flow. This approach allows for incremental testing and validation throughout the development process.

Key considerations in this plan include:
- Security is addressed throughout, with specific hardening in Step 35
- Error handling is comprehensive, including LLM-based recovery
- Progressive schema learning is fully implemented
- The extension is adaptable across multiple browsers
- Testing is thorough, covering unit, component, and end-to-end tests

This plan should provide a clear roadmap for implementing the complete functionality specified in the technical requirements.