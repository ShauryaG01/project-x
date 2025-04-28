import { Parser } from 'node-sql-parser';

export interface SQLValidationError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

export interface SQLValidationResult {
  isValid: boolean;
  errors: SQLValidationError[];
  ast?: any; // SQL AST for valid queries
}

interface TableNode {
  table: string;
  as?: string;
  join?: string;
  on?: {
    operator: string;
    left: any;
    right: any;
  };
  expr?: any;
}

interface ColumnNode {
  expr?: {
    type: string;
    name?: string;
    value?: any;
  };
  value?: any;
  as?: string;
}

interface SQLAst {
  from?: TableNode | TableNode[];
  columns?: ColumnNode[];
  groupby?: any[];
  [key: string]: any;
}

/**
 * Validates SQL query for syntax and semantic correctness
 * @param query SQL query to validate
 * @returns Validation result with errors if any
 */
export function validateSQL(query: string): SQLValidationResult {
  try {
    const parser = new Parser();
    // Parse SQL to check syntax
    const ast = parser.parse(query, { database: 'mysql' }) as SQLAst; // Specify database dialect
    
    const errors: SQLValidationError[] = [];
    
    // Semantic validation rules
    validateTableReferences(ast, errors);
    validateColumnReferences(ast, errors);
    validateJoinConditions(ast, errors);
    validateAggregations(ast, errors);
    validateSubqueries(ast, errors);
    
    return {
      isValid: errors.length === 0,
      errors,
      ast: errors.length === 0 ? ast : undefined
    };
  } catch (error: any) {
    // Handle syntax errors from parser
    return {
      isValid: false,
      errors: [{
        message: error.message,
        line: error.line || 1,
        column: error.column || 0,
        severity: 'error'
      }]
    };
  }
}

/**
 * Validates table references in FROM and JOIN clauses
 */
function validateTableReferences(ast: SQLAst, errors: SQLValidationError[]): void {
  if (!ast || !ast.from) return;

  const tables = Array.isArray(ast.from) ? ast.from : [ast.from];
  const usedAliases = new Set<string>();

  tables.forEach((table: TableNode) => {
    // Check for empty table names
    if (!table.table) {
      errors.push({
        message: 'Missing table name in FROM clause',
        line: 1,
        column: 0,
        severity: 'error'
      });
      return;
    }

    // Validate table aliases
    if (table.as) {
      if (usedAliases.has(table.as)) {
        errors.push({
          message: `Duplicate table alias '${table.as}'`,
          line: 1,
          column: 0,
          severity: 'error'
        });
      }
      usedAliases.add(table.as);
    }
  });
}

/**
 * Validates column references in SELECT, WHERE, GROUP BY etc.
 */
function validateColumnReferences(ast: SQLAst, errors: SQLValidationError[]): void {
  if (!ast || !ast.columns) return;

  const columns = ast.columns;
  const usedAliases = new Set<string>();

  columns.forEach((column: ColumnNode) => {
    // Check for empty column names
    if (!column.expr && !column.value) {
      errors.push({
        message: 'Invalid column reference',
        line: 1,
        column: 0,
        severity: 'error'
      });
      return;
    }

    // Validate column aliases
    if (column.as) {
      if (usedAliases.has(column.as)) {
        errors.push({
          message: `Duplicate column alias '${column.as}'`,
          line: 1,
          column: 0,
          severity: 'error'
        });
      }
      usedAliases.add(column.as);
    }
  });
}

/**
 * Validates JOIN conditions
 */
function validateJoinConditions(ast: SQLAst, errors: SQLValidationError[]): void {
  if (!ast || !ast.from) return;

  const tables = Array.isArray(ast.from) ? ast.from : [ast.from];

  tables.forEach((table: TableNode) => {
    if (table.join) {
      // Check for missing ON clause in JOIN
      if (!table.on) {
        errors.push({
          message: `Missing ON clause in ${table.join.toUpperCase()} JOIN`,
          line: 1,
          column: 0,
          severity: 'error'
        });
        return;
      }

      // Validate join condition structure
      if (!table.on.operator || !table.on.left || !table.on.right) {
        errors.push({
          message: 'Invalid JOIN condition structure',
          line: 1,
          column: 0,
          severity: 'error'
        });
      }
    }
  });
}

/**
 * Validates aggregation functions and GROUP BY
 */
function validateAggregations(ast: SQLAst, errors: SQLValidationError[]): void {
  if (!ast || !ast.columns) return;

  const hasAggregation = ast.columns.some((col: ColumnNode) => 
    col.expr && col.expr.type === 'function' && col.expr.name &&
    ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].includes(col.expr.name.toUpperCase())
  );

  // Check for mixing aggregated and non-aggregated columns
  if (hasAggregation) {
    const nonAggregatedCols = ast.columns.filter((col: ColumnNode) =>
      col.expr && col.expr.type !== 'function' && !ast.groupby
    );

    if (nonAggregatedCols.length > 0 && !ast.groupby) {
      errors.push({
        message: 'Non-aggregated columns must be included in GROUP BY when using aggregation functions',
        line: 1,
        column: 0,
        severity: 'error'
      });
    }
  }
}

/**
 * Validates subquery structure and references
 */
function validateSubqueries(ast: SQLAst, errors: SQLValidationError[]): void {
  if (!ast) return;

  // Recursively validate subqueries in FROM clause
  if (ast.from) {
    const tables = Array.isArray(ast.from) ? ast.from : [ast.from];
    tables.forEach((table: TableNode) => {
      if (table.expr && typeof table.expr === 'object') {
        validateSubqueryNode(table.expr, errors);
      }
    });
  }
}

/**
 * Helper function to validate a subquery node
 */
function validateSubqueryNode(node: SQLAst, errors: SQLValidationError[]): void {
  // Validate the subquery AST recursively
  validateTableReferences(node, errors);
  validateColumnReferences(node, errors);
  validateJoinConditions(node, errors);
  validateAggregations(node, errors);
  validateSubqueries(node, errors);
} 