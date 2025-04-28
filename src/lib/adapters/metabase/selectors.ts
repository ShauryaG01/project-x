/**
 * DOM selectors for Metabase
 * Defines selectors for detecting and interacting with Metabase UI
 */

import { AdapterConfig, SelectorDefinition } from '../../../types/adapters';

/**
 * Selector map for Metabase UI elements
 */
const metabaseSelectors: Record<string, SelectorDefinition> = {
  // Selectors for detecting Metabase
  metabase_logo: {
    type: 'CSS',
    selector: '.Logo',
    description: 'Metabase logo'
  },
  query_builder: {
    type: 'CSS',
    selector: '.QueryBuilder',
    description: 'Metabase query builder container'
  },
  database_selector: {
    type: 'CSS',
    selector: '.GuiBuilder-data',
    description: 'Database selector in query builder'
  },
  
  // SQL Editor elements
  sql_editor: {
    type: 'CSS',
    selector: '.ace_editor',
    description: 'SQL editor component'
  },
  sql_query: {
    type: 'CSS',
    selector: '.ace_content',
    description: 'SQL query content area'
  },
  run_query_button: {
    type: 'XPATH',
    selector: '//button[@data-testid="run-button"]',
    description: 'Run query button'
  },
  
  // Results elements
  result_table: {
    type: 'CSS',
    selector: '.TableInteractive',
    description: 'Query results table'
  },
  visualization_settings: {
    type: 'CSS',
    selector: '.ChartSettings',
    description: 'Visualization settings panel'
  },
  
  // Database elements
  database_list: {
    type: 'CSS',
    selector: '.List-section',
    description: 'Database list in admin page'
  },
  database_details: {
    type: 'CSS',
    selector: '.AdminDatabase',
    description: 'Database details in admin page'
  },
  
  // Error elements
  error_message: {
    type: 'CSS',
    selector: '.QueryError',
    description: 'Query error message'
  },
  error_message_head: {
    type: 'CSS',
    selector: '.QueryError-detailHeader',
    description: 'Error message header'
  },
  
  // Dashboard elements
  dashboard_container: {
    type: 'CSS',
    selector: '.Dashboard',
    description: 'Dashboard container'
  },
  dashboard_card: {
    type: 'CSS',
    selector: '.DashCard',
    description: 'Dashboard card'
  }
};

/**
 * Returns the full configuration for Metabase adapter
 * @returns Metabase adapter configuration
 */
export function getMetabaseConfig(): AdapterConfig {
  return {
    urlPatterns: [
      '.*\/question\/.*',
      '.*\/dashboard\/.*',
      '.*\/browse\/.*',
      '.*\/model\/.*',
      '.*\/admin\/databases.*',
      '.*\/metabase\/.*'
    ],
    selectors: {
      detection: {
        css: [
          metabaseSelectors.metabase_logo.selector,
          metabaseSelectors.query_builder.selector,
          metabaseSelectors.database_selector.selector
        ],
        xpath: [
          '//div[contains(@class, "Nav")]//span[contains(text(), "Metabase")]'
        ]
      },
      interaction: metabaseSelectors
    }
  };
}

/**
 * Returns all Metabase selectors
 * @returns Object containing all Metabase selectors
 */
export function getSelectors(): AdapterConfig['selectors'] {
  return getMetabaseConfig().selectors;
}

/**
 * Returns a specific Metabase selector by key
 * @param key The selector key
 * @returns The selector definition or undefined if not found
 */
export function getSelector(key: string): SelectorDefinition | undefined {
  return metabaseSelectors[key];
}

/**
 * Validates if an element exists in the DOM using the specified selector
 * @param selectorKey The key of the selector to check
 * @returns True if the element exists, false otherwise
 */
export function validateSelector(selectorKey: string): boolean {
  const selector = getSelector(selectorKey);
  if (!selector) {
    return false;
  }
  
  if (selector.type === 'CSS') {
    return !!document.querySelector(selector.selector);
  } else {
    const result = document.evaluate(
      selector.selector,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return !!result.singleNodeValue;
  }
}

/**
 * Metabase UI Selectors
 * 
 * This module contains CSS selectors for Metabase UI elements.
 */

/**
 * Main Metabase application container
 */
export const METABASE_APP = '.metabase-app';

/**
 * Data model browser container
 */
export const DATA_MODEL_BROWSER = '.data-model-browser';

/**
 * Query builder container
 */
export const QUERY_BUILDER = '.query-builder';

/**
 * Database selector
 */
export const DATABASE_SELECTOR = '.database-selector';

/**
 * Table list item
 */
export const TABLE_LIST_ITEM = '.table-list-item';

/**
 * Table detail view
 */
export const TABLE_DETAIL_VIEW = '.table-detail-view';

/**
 * Table header
 */
export const TABLE_HEADER = '.table-header';

/**
 * Table name
 */
export const TABLE_NAME = '.table-name';

/**
 * Table description
 */
export const TABLE_DESCRIPTION = '.table-description';

/**
 * Table ID attribute
 */
export const TABLE_ID_ATTRIBUTE = '[data-table-id]';

/**
 * Column list item
 */
export const COLUMN_LIST_ITEM = '.column-list-item';

/**
 * Column name
 */
export const COLUMN_NAME = '.column-name';

/**
 * Column type
 */
export const COLUMN_TYPE = '.column-type';

/**
 * Column primary key indicator
 */
export const COLUMN_PRIMARY_KEY_INDICATOR = '.column-primary-key';

/**
 * Column foreign key indicator
 */
export const COLUMN_FOREIGN_KEY_INDICATOR = '.column-foreign-key';

/**
 * Column not null indicator
 */
export const COLUMN_NOT_NULL_INDICATOR = '.column-not-null';

/**
 * Column detail view
 */
export const COLUMN_DETAIL_VIEW = '.column-detail-view';

/**
 * Column description
 */
export const COLUMN_DESCRIPTION = '.column-description';

/**
 * Column detail close button
 */
export const COLUMN_DETAIL_CLOSE_BUTTON = '.column-detail-close';

/**
 * Foreign key relationship detail
 */
export const FK_RELATIONSHIP_DETAIL = '.fk-relationship-detail';

/**
 * Foreign key source table
 */
export const FK_SOURCE_TABLE = '.fk-source-table';

/**
 * Foreign key source column
 */
export const FK_SOURCE_COLUMN = '.fk-source-column';

/**
 * Foreign key target table
 */
export const FK_TARGET_TABLE = '.fk-target-table';

/**
 * Foreign key target column
 */
export const FK_TARGET_COLUMN = '.fk-target-column';

/**
 * Foreign key relationship close button
 */
export const FK_RELATIONSHIP_CLOSE_BUTTON = '.fk-relationship-close';

/**
 * Admin button
 */
export const ADMIN_BUTTON = '.admin-button';

/**
 * Admin menu
 */
export const ADMIN_MENU = '.admin-menu';

/**
 * Data model option
 */
export const DATA_MODEL_OPTION = '.data-model-option'; 