# MetabaseNL

A browser extension that allows non-technical users to generate and execute SQL queries in Metabase using natural language.

## Features

- Translate natural language questions into SQL using AI
- Progressively learn your database schema through interaction
- Manage query history
- Smart error handling and recovery
- Works across multiple browsers

## Installation

### Development Setup

1. Clone this repository
2. Install dependencies
   ```
   npm install
   ```
3. Copy `env.example` to `.env` and add your API keys
4. Start the development server
   ```
   npm run dev
   ```
5. Build the extension
   ```
   npm run build

   ```
6. Load the extension in your browser:
   - Chrome: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the `dist` folder
   - Firefox: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file in the `dist` folder
   - Edge: Go to `edge://extensions/`, enable "Developer mode", click "Load unpacked", and select the `dist` folder

## Usage

1. Navigate to your Metabase instance
2. Click on the MetabaseNL extension icon
3. Type your question in natural language
4. View the generated SQL and results

## Development

This project uses:
- TypeScript for type safety
- React for UI components
- Vite for building
- IndexedDB for storage
- OpenAI/Anthropic for natural language processing

To run tests:
```
npm test
```

To run end-to-end tests:
```
npm run test:e2e
```

## License

MIT 
MIT 