import { validateSQL, SQLValidationResult } from '../sql/validator';
import { formatSQL } from '../sql/formatter';
import { getTemplate, fillTemplate } from '../sql/templates';
import { SQLAst } from '../../types/sql';

export interface QueryProcessingResult {
  query: string;
  validation: SQLValidationResult;
  formatted: string;
  error?: string;
  data?: Record<string, any>[];
  sql?: string;
}

export interface QueryProcessingOptions {
  format?: boolean;
  validate?: boolean;
  useTemplates?: boolean;
}

/**
 * Processes a natural language query into SQL
 * @param query Natural language query
 * @param options Processing options
 * @returns Processing result with SQL query and validation
 */
export async function processQuery(
  query: string,
  options: QueryProcessingOptions = {}
): Promise<QueryProcessingResult> {
  const {
    format = true,
    validate = true,
    useTemplates = true
  } = options;

  try {
    // Convert natural language to SQL (placeholder for LLM integration)
    const sqlQuery = await convertToSQL(query);
    
    // Validate the query if requested
    const validation = validate ? validateSQL(sqlQuery) : { isValid: true, errors: [] };
    
    // Format the query if requested
    const formatted = format ? formatSQL(sqlQuery) : sqlQuery;
    
    return {
      query: sqlQuery,
      validation,
      formatted
    };
  } catch (error) {
    return {
      query: '',
      validation: { isValid: false, errors: [] },
      formatted: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Converts natural language to SQL (placeholder for LLM integration)
 */
async function convertToSQL(query: string): Promise<string> {
  // TODO: Implement LLM integration for natural language to SQL conversion
  // For now, return a placeholder query
  return 'SELECT * FROM table';
}

/**
 * Processes a query using SQL templates
 * @param templateName Template name
 * @param params Template parameters
 * @returns Processing result with SQL query and validation
 */
export async function processTemplateQuery(
  templateName: string,
  params: Record<string, string>,
  options: QueryProcessingOptions = {}
): Promise<QueryProcessingResult> {
  const template = getTemplate(templateName);
  
  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }
  
  const query = fillTemplate(template, params);
  return processQuery(query, options);
}

/**
 * Validates a SQL query
 * @param query SQL query to validate
 * @returns Validation result
 */
export function validateQuery(query: string): SQLValidationResult {
  return validateSQL(query);
}

/**
 * Formats a SQL query
 * @param query SQL query to format
 * @returns Formatted query
 */
export function formatQuery(query: string): string {
  return formatSQL(query);
} 