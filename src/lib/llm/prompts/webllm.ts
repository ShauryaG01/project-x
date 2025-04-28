/**
 * WebLLM-specific prompts
 * 
 * These prompts are optimized for local models running via WebLLM.js
 * They are simplified/optimized for smaller context windows and more basic models
 */

import { LLMOperationType } from '../types';

/**
 * System prompts by operation type - simplified for smaller models
 */
export const webllmSystemPrompts: Record<LLMOperationType, string> = {
  [LLMOperationType.NL_TO_SQL]: `
You are an expert SQL assistant. Convert natural language questions to SQL queries.
Use the provided database schema to create accurate queries.
Return ONLY the SQL query with no explanations.
`,

  [LLMOperationType.EXPLAIN_SQL]: `
You are an expert SQL educator. Explain SQL queries in clear, simple language.
Focus on what the query does and how it works in straightforward terms.
`,

  [LLMOperationType.FIX_SQL]: `
You are an expert SQL debugger. Fix broken SQL queries based on the error message.
Return ONLY the corrected SQL query with no explanations.
`,

  [LLMOperationType.ANALYZE_RESULTS]: `
You are an expert data analyst. Interpret SQL query results clearly and concisely.
Focus on the most important insights from the data.
`
};

/**
 * User prompt templates for natural language to SQL - simplified for smaller models
 */
export const nlToSqlPromptTemplate = (question: string, schema: string, dbType: string): string => {
  // Remove unnecessary whitespace to save tokens
  const compactSchema = schema.replace(/\n\s*\n/g, '\n').trim();
  
  return `Database: ${dbType}
Schema: ${compactSchema}
Question: ${question}
SQL:`;
};

/**
 * User prompt template for SQL explanation - simplified for smaller models
 */
export const explainSqlPromptTemplate = (query: string): string => {
  return `Explain this SQL query in simple terms:
${query}`;
};

/**
 * User prompt template for SQL fixing - simplified for smaller models
 */
export const fixSqlPromptTemplate = (query: string, error: string, schema?: string): string => {
  let promptText = `Fix this SQL query:
${query}
Error: ${error}`;

  if (schema) {
    const compactSchema = schema.replace(/\n\s*\n/g, '\n').trim();
    promptText += `\nSchema: ${compactSchema}`;
  }

  return promptText;
};

/**
 * User prompt template for analyzing query results - simplified for smaller models
 */
export const analyzeResultsPromptTemplate = (
  query: string, 
  results: string, 
  originalQuestion?: string
): string => {
  let promptText = `Query: ${query}
Results: ${results}`;

  if (originalQuestion) {
    promptText += `\nQuestion: ${originalQuestion}`; 
  }

  promptText += `\nAnalyze these results:`;

  return promptText;
}; 