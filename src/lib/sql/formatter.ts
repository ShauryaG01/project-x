import { Parser } from 'node-sql-parser';

export interface SQLFormatOptions {
  indentSize?: number;
  keywordCase?: 'upper' | 'lower';
  maxLineLength?: number;
}

const defaultOptions: SQLFormatOptions = {
  indentSize: 2,
  keywordCase: 'upper',
  maxLineLength: 80
};

/**
 * Formats a SQL query according to specified options
 * @param query SQL query to format
 * @param options Formatting options
 * @returns Formatted SQL query
 */
export function formatSQL(query: string, options: SQLFormatOptions = {}): string {
  const parser = new Parser();
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // Parse the query to get AST
    const ast = parser.parse(query, { database: 'mysql' });
    
    // Format the AST
    const formattedQuery = formatAST(ast, mergedOptions);
    
    return formattedQuery;
  } catch (error) {
    // If parsing fails, return original query
    console.warn('Failed to format SQL query:', error);
    return query;
  }
}

/**
 * Formats SQL AST into a formatted query string
 */
function formatAST(ast: any, options: SQLFormatOptions, indent = 0): string {
  const indentStr = ' '.repeat(indent * options.indentSize!);
  const keywordCase = options.keywordCase!;
  
  // Handle different AST node types
  switch (ast.type) {
    case 'select':
      return formatSelect(ast, options, indent);
    case 'insert':
      return formatInsert(ast, options, indent);
    case 'update':
      return formatUpdate(ast, options, indent);
    case 'delete':
      return formatDelete(ast, options, indent);
    default:
      return JSON.stringify(ast);
  }
}

/**
 * Formats a SELECT statement
 */
function formatSelect(ast: any, options: SQLFormatOptions, indent: number): string {
  const indentStr = ' '.repeat(indent * options.indentSize!);
  const keywordCase = options.keywordCase!;
  
  const columns = ast.columns.map((col: any) => formatColumn(col, options, indent + 1)).join(',\n' + indentStr);
  const from = formatFrom(ast.from, options, indent + 1);
  const where = ast.where ? `\n${indentStr}WHERE ${formatWhere(ast.where, options, indent + 1)}` : '';
  const groupBy = ast.groupby ? `\n${indentStr}GROUP BY ${formatGroupBy(ast.groupby, options, indent + 1)}` : '';
  const having = ast.having ? `\n${indentStr}HAVING ${formatHaving(ast.having, options, indent + 1)}` : '';
  const orderBy = ast.orderby ? `\n${indentStr}ORDER BY ${formatOrderBy(ast.orderby, options, indent + 1)}` : '';
  const limit = ast.limit ? `\n${indentStr}LIMIT ${ast.limit.value}` : '';
  
  return `${indentStr}SELECT\n${columns}\n${indentStr}FROM ${from}${where}${groupBy}${having}${orderBy}${limit}`;
}

/**
 * Formats a column expression
 */
function formatColumn(col: any, options: SQLFormatOptions, indent: number): string {
  const indentStr = ' '.repeat(indent * options.indentSize!);
  let result = indentStr;
  
  if (col.expr) {
    if (col.expr.type === 'function') {
      result += `${col.expr.name.toUpperCase()}(${formatFunctionArgs(col.expr.args, options)})`;
    } else {
      result += formatExpression(col.expr, options);
    }
  } else {
    result += col.value;
  }
  
  if (col.as) {
    result += ` AS ${col.as}`;
  }
  
  return result;
}

/**
 * Formats function arguments
 */
function formatFunctionArgs(args: any[], options: SQLFormatOptions): string {
  return args.map((arg: any) => formatExpression(arg, options)).join(', ');
}

/**
 * Formats an expression
 */
function formatExpression(expr: any, options: SQLFormatOptions): string {
  if (typeof expr === 'string') {
    return expr;
  }
  
  if (expr.type === 'binary_expr') {
    return `${formatExpression(expr.left, options)} ${expr.operator} ${formatExpression(expr.right, options)}`;
  }
  
  if (expr.type === 'column_ref') {
    return expr.column;
  }
  
  if (expr.type === 'number') {
    return expr.value.toString();
  }
  
  if (expr.type === 'string') {
    return `'${expr.value}'`;
  }
  
  return JSON.stringify(expr);
}

/**
 * Formats FROM clause
 */
function formatFrom(from: any, options: SQLFormatOptions, indent: number): string {
  if (Array.isArray(from)) {
    return from.map((table: any) => formatTable(table, options, indent)).join('\n');
  }
  return formatTable(from, options, indent);
}

/**
 * Formats a table reference
 */
function formatTable(table: any, options: SQLFormatOptions, indent: number): string {
  let result = table.table;
  
  if (table.as) {
    result += ` AS ${table.as}`;
  }
  
  if (table.join) {
    result += ` ${table.join.toUpperCase()} JOIN ${table.table}`;
    if (table.on) {
      result += ` ON ${formatExpression(table.on, options)}`;
    }
  }
  
  return result;
}

/**
 * Formats WHERE clause
 */
function formatWhere(where: any, options: SQLFormatOptions, indent: number): string {
  return formatExpression(where, options);
}

/**
 * Formats GROUP BY clause
 */
function formatGroupBy(groupBy: any[], options: SQLFormatOptions, indent: number): string {
  return groupBy.map((item: any) => formatExpression(item, options)).join(', ');
}

/**
 * Formats HAVING clause
 */
function formatHaving(having: any, options: SQLFormatOptions, indent: number): string {
  return formatExpression(having, options);
}

/**
 * Formats ORDER BY clause
 */
function formatOrderBy(orderBy: any[], options: SQLFormatOptions, indent: number): string {
  return orderBy.map((item: any) => {
    let result = formatExpression(item.expr, options);
    if (item.type) {
      result += ` ${item.type.toUpperCase()}`;
    }
    return result;
  }).join(', ');
}

/**
 * Formats an INSERT statement
 */
function formatInsert(ast: any, options: SQLFormatOptions, indent: number): string {
  const indentStr = ' '.repeat(indent * options.indentSize!);
  const keywordCase = options.keywordCase!;
  
  const table = ast.table[0].table;
  const columns = ast.columns.map((col: string) => col).join(', ');
  const values = ast.values.map((row: any[]) => 
    `(${row.map((val: any) => formatExpression(val, options)).join(', ')})`
  ).join(',\n' + indentStr);
  
  return `${indentStr}INSERT INTO ${table} (${columns})\n${indentStr}VALUES\n${values}`;
}

/**
 * Formats an UPDATE statement
 */
function formatUpdate(ast: any, options: SQLFormatOptions, indent: number): string {
  const indentStr = ' '.repeat(indent * options.indentSize!);
  const keywordCase = options.keywordCase!;
  
  const table = ast.table[0].table;
  const set = ast.set.map((item: any) => 
    `${item.column} = ${formatExpression(item.value, options)}`
  ).join(',\n' + indentStr);
  const where = ast.where ? `\n${indentStr}WHERE ${formatWhere(ast.where, options, indent + 1)}` : '';
  
  return `${indentStr}UPDATE ${table}\n${indentStr}SET ${set}${where}`;
}

/**
 * Formats a DELETE statement
 */
function formatDelete(ast: any, options: SQLFormatOptions, indent: number): string {
  const indentStr = ' '.repeat(indent * options.indentSize!);
  const keywordCase = options.keywordCase!;
  
  const table = ast.table[0].table;
  const where = ast.where ? `\n${indentStr}WHERE ${formatWhere(ast.where, options, indent + 1)}` : '';
  
  return `${indentStr}DELETE FROM ${table}${where}`;
} 