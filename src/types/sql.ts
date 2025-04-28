/**
 * TypeScript interfaces for SQL-related types
 */

export interface SQLAst {
  type: 'select' | 'insert' | 'update' | 'delete';
  columns?: ColumnNode[];
  from?: TableNode | TableNode[];
  where?: ExpressionNode;
  groupby?: ExpressionNode[];
  having?: ExpressionNode;
  orderby?: OrderByNode[];
  limit?: LimitNode;
  table?: TableNode[];
  set?: SetNode[];
  values?: any[][];
}

export interface ColumnNode {
  expr?: ExpressionNode;
  value?: string;
  as?: string;
}

export interface TableNode {
  table: string;
  as?: string;
  join?: string;
  on?: ExpressionNode;
  expr?: SQLAst;
}

export interface ExpressionNode {
  type: 'binary_expr' | 'column_ref' | 'function' | 'number' | 'string';
  operator?: string;
  left?: ExpressionNode;
  right?: ExpressionNode;
  column?: string;
  name?: string;
  args?: ExpressionNode[];
  value?: any;
}

export interface OrderByNode {
  expr: ExpressionNode;
  type?: 'ASC' | 'DESC';
}

export interface LimitNode {
  value: number;
}

export interface SetNode {
  column: string;
  value: ExpressionNode;
}

export interface SQLValidationError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

export interface SQLValidationResult {
  isValid: boolean;
  errors: SQLValidationError[];
  ast?: SQLAst;
}

export interface SQLFormatOptions {
  indentSize?: number;
  keywordCase?: 'upper' | 'lower';
  maxLineLength?: number;
}

export interface SQLTemplate {
  name: string;
  description: string;
  template: string;
  parameters: string[];
} 