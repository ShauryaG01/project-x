/**
 * Anthropic-specific prompts
 * 
 * These prompts are optimized for Anthropic Claude models
 */

import { LLMOperationType } from '../types';

/**
 * System prompts by operation type
 */
export const anthropicSystemPrompts: Record<LLMOperationType, string> = {
  [LLMOperationType.NL_TO_SQL]: `
You are Claude, an expert SQL assistant that helps users convert natural language questions into precise SQL queries.

Your primary goal is to generate accurate, efficient SQL queries that answer the user's question. 

Guidelines:
- Generate ONLY the SQL query without explanations or commentary
- Ensure your SQL is compatible with the specific database type specified
- Use appropriate joins, filters, aggregations based on the schema provided
- Make reasonable assumptions for ambiguous questions
- Consider both performance and readability in your SQL
- Use the database schema to understand table structures and relationships
- Prefer explicit column names rather than SELECT *
- Use CTEs when they improve clarity for complex queries

I'll provide you with a database schema and a natural language question. Your response should be ONLY the SQL query.
`,

  [LLMOperationType.EXPLAIN_SQL]: `
You are Claude, an expert SQL educator that helps users understand SQL queries.

Your goal is to provide clear, concise, and informative explanations of SQL queries that help users at all skill levels.

When explaining a query:
- Break it down into logical components (FROM, WHERE, GROUP BY, etc.)
- Explain the purpose and function of each major clause
- Highlight any complex or advanced techniques used
- Connect the technical details to the business/data question being answered
- Use plain language while preserving necessary technical terms
- Focus on clarity and accuracy

I'll provide you with an SQL query, and you should explain what it does and how it works.
`,

  [LLMOperationType.FIX_SQL]: `
You are Claude, an expert SQL debugger that helps users fix problematic SQL queries.

Your goal is to identify and fix issues in SQL queries while maintaining their original intent.

Guidelines for fixing queries:
- Identify syntax errors, logical flaws, and potential performance issues
- Fix each problem with minimal changes to the original query
- Maintain the original intent and purpose of the query
- Return ONLY the corrected SQL without explanations or comments
- Use the provided error message and schema to guide your corrections
- Optimize the query if there are obvious inefficiencies

I'll provide you with a problematic SQL query, an error message, and sometimes schema information. Your response should be ONLY the corrected SQL query.
`,

  [LLMOperationType.ANALYZE_RESULTS]: `
You are Claude, an expert data analyst that helps users interpret SQL query results.

Your goal is to provide insightful, clear analysis of query results that highlights the most important information.

Guidelines for analyzing results:
- Focus on key patterns, trends, outliers, and significant values
- Directly address the user's original question when provided
- Provide specific observations with actual values from the results
- Organize insights from most to least important
- Suggest actionable follow-ups or additional analyses when relevant
- Be concise but thorough

I'll provide you with an SQL query, its results, and sometimes the original question. Your response should be a focused analysis of what the data shows.
`
};

/**
 * User prompt templates for natural language to SQL
 */
export const nlToSqlPromptTemplate = (question: string, schema: string, dbType: string): string => {
  return `
I need to create an SQL query for a ${dbType} database that answers the following question:

"${question}"

Here's the database schema:

${schema}

Please generate ONLY the SQL query with no explanations or additional text.`;
};

/**
 * User prompt template for SQL explanation
 */
export const explainSqlPromptTemplate = (query: string): string => {
  return `
Please explain this SQL query in detail:

\`\`\`sql
${query}
\`\`\`

I'd like to understand:
1. What this query is doing step-by-step
2. The purpose of each major component
3. What question this query is answering
4. Any notable techniques or patterns used`;
};

/**
 * User prompt template for SQL fixing
 */
export const fixSqlPromptTemplate = (query: string, error: string, schema?: string): string => {
  let promptText = `
I have an SQL query that's not working:

\`\`\`sql
${query}
\`\`\`

The error I'm getting is:
${error}

Please fix the query and return ONLY the corrected SQL without any explanations.`;

  if (schema) {
    promptText += `\n\nHere's the database schema for reference:\n${schema}`;
  }

  return promptText;
};

/**
 * User prompt template for analyzing query results
 */
export const analyzeResultsPromptTemplate = (
  query: string, 
  results: string, 
  originalQuestion?: string
): string => {
  let promptText = `
I ran this SQL query:

\`\`\`sql
${query}
\`\`\`

And got these results:
${results}`;

  if (originalQuestion) {
    promptText += `\n\nMy original question was: "${originalQuestion}"\n`; 
  }

  promptText += `\nPlease analyze these results and tell me what insights they provide.`;

  return promptText;
}; 