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