/**
 * SQL template library containing common query patterns
 */

export interface SQLTemplate {
  name: string;
  description: string;
  template: string;
  parameters: string[];
}

export const SQL_TEMPLATES: SQLTemplate[] = [
  {
    name: 'select_all',
    description: 'Select all columns from a table',
    template: 'SELECT * FROM {{table}}',
    parameters: ['table']
  },
  {
    name: 'select_columns',
    description: 'Select specific columns from a table',
    template: 'SELECT {{columns}} FROM {{table}}',
    parameters: ['columns', 'table']
  },
  {
    name: 'select_with_where',
    description: 'Select with WHERE condition',
    template: 'SELECT {{columns}} FROM {{table}} WHERE {{condition}}',
    parameters: ['columns', 'table', 'condition']
  },
  {
    name: 'select_with_join',
    description: 'Select with JOIN',
    template: 'SELECT {{columns}} FROM {{table1}} {{join_type}} JOIN {{table2}} ON {{condition}}',
    parameters: ['columns', 'table1', 'join_type', 'table2', 'condition']
  },
  {
    name: 'select_with_group_by',
    description: 'Select with GROUP BY',
    template: 'SELECT {{columns}} FROM {{table}} GROUP BY {{group_by}}',
    parameters: ['columns', 'table', 'group_by']
  },
  {
    name: 'select_with_order_by',
    description: 'Select with ORDER BY',
    template: 'SELECT {{columns}} FROM {{table}} ORDER BY {{order_by}}',
    parameters: ['columns', 'table', 'order_by']
  },
  {
    name: 'select_with_limit',
    description: 'Select with LIMIT',
    template: 'SELECT {{columns}} FROM {{table}} LIMIT {{limit}}',
    parameters: ['columns', 'table', 'limit']
  },
  {
    name: 'insert_values',
    description: 'Insert values into a table',
    template: 'INSERT INTO {{table}} ({{columns}}) VALUES ({{values}})',
    parameters: ['table', 'columns', 'values']
  },
  {
    name: 'update_values',
    description: 'Update values in a table',
    template: 'UPDATE {{table}} SET {{set}} WHERE {{condition}}',
    parameters: ['table', 'set', 'condition']
  },
  {
    name: 'delete_rows',
    description: 'Delete rows from a table',
    template: 'DELETE FROM {{table}} WHERE {{condition}}',
    parameters: ['table', 'condition']
  }
];

/**
 * Fills a SQL template with provided parameters
 * @param template SQL template to fill
 * @param params Parameters to fill the template with
 * @returns Filled SQL query
 */
export function fillTemplate(template: SQLTemplate, params: Record<string, string>): string {
  let query = template.template;
  
  for (const param of template.parameters) {
    if (!(param in params)) {
      throw new Error(`Missing required parameter: ${param}`);
    }
    query = query.replace(`{{${param}}}`, params[param]);
  }
  
  return query;
}

/**
 * Gets a SQL template by name
 * @param name Template name
 * @returns SQL template or undefined if not found
 */
export function getTemplate(name: string): SQLTemplate | undefined {
  return SQL_TEMPLATES.find(t => t.name === name);
}

/**
 * Lists all available SQL templates
 * @returns Array of SQL templates
 */
export function listTemplates(): SQLTemplate[] {
  return SQL_TEMPLATES;
} 