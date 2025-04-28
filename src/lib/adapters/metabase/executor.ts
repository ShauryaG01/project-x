/**
 * Metabase SQL Executor
 * Provides functionality to inject and execute SQL queries in Metabase
 */

import { getSelector, validateSelector } from './selectors';
import { SelectorDefinition } from '../../../types/adapters';

/**
 * Interface for query execution result
 */
export interface SqlExecutionResult {
  success: boolean;
  error?: string;
  executionTime?: number;
}

/**
 * Interface for variables in SQL queries
 */
interface QueryVariable {
  name: string;
  value?: string;
  type: 'text' | 'number' | 'date';
  displayName?: string;
}

/**
 * Class for performing SQL operations in Metabase
 */
export class MetabaseExecutor {
  /**
   * The current SQL query
   */
  private currentQuery: string = '';

  /**
   * Timestamp of when the query execution started
   */
  private executionStartTime: number | null = null;

  /**
   * Injects SQL query into Metabase's editor
   * @param sql SQL query to inject
   * @returns Promise resolving to true if successful
   */
  async injectSql(sql: string): Promise<boolean> {
    try {
      console.log('Injecting SQL:', sql);
      this.currentQuery = sql;

      // Use Metabase's Redux store to update the query
      const success = await this.updateMetabaseQuery(sql);
      return success;
    } catch (error) {
      console.error('Error injecting SQL:', error);
      return false;
    }
  }

  /**
   * Execute the current SQL query
   * @returns Promise resolving to execution result
   */
  async executeQuery(): Promise<SqlExecutionResult> {
    try {
      // Start timing the execution
      this.executionStartTime = Date.now();

      // Find and click run button
      const runButton = await this.getRunButton();
      if (!runButton) {
        return { 
          success: false, 
          error: 'Run button not found' 
        };
      }

      // Click the run button
      runButton.click();

      // Wait for results to load or error to appear
      const result = await this.waitForQueryCompletion();
      
      // Calculate execution time
      const executionTime = this.executionStartTime 
        ? Date.now() - this.executionStartTime 
        : undefined;
      
      return {
        ...result,
        executionTime
      };
    } catch (error) {
      console.error('Error executing SQL query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      this.executionStartTime = null;
    }
  }

  /**
   * Updates a template variable in the SQL query
   * @param variable Variable information
   * @returns Promise resolving to true if successful
   */
  async setVariable(variable: QueryVariable): Promise<boolean> {
    try {
      // Get current card state from Metabase
      const currentCard = await this.getMetabaseState('qb.card');
      if (!currentCard) {
        console.error('Cannot update variable: Card state not found');
        return false;
      }

      // Access template tags
      let templateTags = currentCard.dataset_query?.native?.['template-tags'] || {};

      // Check if variable exists
      if (!templateTags[variable.name]) {
        console.error(`Variable ${variable.name} not found in query`);
        return false;
      }

      // Update variable metadata
      if (variable.type) {
        templateTags[variable.name].type = variable.type;
      }
      
      if (variable.displayName) {
        templateTags[variable.name]['display-name'] = variable.displayName;
      }

      // Update the card
      await this.dispatchMetabaseAction(
        'metabase/qb/UPDATE_QUESTION', 
        { card: currentCard }
      );

      // Set the parameter value if provided
      if (variable.value !== undefined) {
        // Find the parameter ID
        const parameters = currentCard.parameters || [];
        const parameter = parameters.find((p: any) => p.slug === variable.name);
        
        if (parameter) {
          await this.dispatchMetabaseAction(
            'metabase/qb/SET_PARAMETER_VALUE',
            { id: parameter.id, value: variable.value }
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error setting variable:', error);
      return false;
    }
  }

  /**
   * Updates the SQL query in Metabase's state
   * @param sql SQL query to set
   * @returns Promise resolving to true if successful
   */
  private async updateMetabaseQuery(sql: string): Promise<boolean> {
    try {
      // Get the current card state
      const currentCard = await this.getMetabaseState('qb.card');
      if (!currentCard) {
        console.error('Cannot update query: Card state not found');
        return false;
      }

      // Extract variables from SQL
      const variables = this.extractVariables(sql);
      
      // Update template tags
      const templateTags = this.buildTemplateTags(
        variables, 
        currentCard.dataset_query?.native?.['template-tags'] || {}
      );
      
      // Update parameters
      const parameters = this.buildParameters(
        variables, 
        currentCard.parameters || []
      );

      // Update the card with new SQL and template tags
      currentCard.dataset_query.native['template-tags'] = templateTags;
      currentCard.parameters = parameters;
      currentCard.dataset_query.native.query = sql;

      // Dispatch the update action
      await this.dispatchMetabaseAction(
        'metabase/qb/UPDATE_QUESTION', 
        { card: currentCard }
      );
      
      // Update the URL
      await this.dispatchMetabaseAction('metabase/qb/UPDATE_URL', null);

      return true;
    } catch (error) {
      console.error('Error updating Metabase query:', error);
      return false;
    }
  }

  /**
   * Extract variables from SQL query
   * @param sql SQL query
   * @returns Array of variable names and UUIDs
   */
  private extractVariables(sql: string): Array<{ name: string, uuid: string }> {
    const variables: Array<{ name: string, uuid: string }> = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(sql)) !== null) {
      const varName = match[1].trim();
      // Generate a UUID for each variable
      const uuid = this.generateUUID();
      variables.push({ name: varName, uuid });
    }

    return variables;
  }

  /**
   * Build template tags object for variables
   * @param variables Array of variables
   * @param existingTags Existing template tags
   * @returns Updated template tags object
   */
  private buildTemplateTags(
    variables: Array<{ name: string, uuid: string }>,
    existingTags: Record<string, any>
  ): Record<string, any> {
    const tags = { ...existingTags };

    variables.forEach(({ name, uuid }) => {
      // Use existing tag if available, otherwise create a new one
      if (!tags[name]) {
        tags[name] = {
          id: uuid,
          name,
          'display-name': name,
          type: 'text',
          required: false
        };
      }
    });

    return tags;
  }

  /**
   * Build parameters array for variables
   * @param variables Array of variables
   * @param existingParams Existing parameters
   * @returns Updated parameters array
   */
  private buildParameters(
    variables: Array<{ name: string, uuid: string }>,
    existingParams: Array<any>
  ): Array<any> {
    const params = [...existingParams];
    const typeMap: Record<string, string> = {
      'text': 'category',
      'number': 'number/=',
      'date': 'date/single'
    };

    variables.forEach(({ name, uuid }) => {
      // Check if parameter already exists
      const existingParam = params.find((p: any) => p.slug === name);
      
      if (!existingParam) {
        // Create a new parameter
        params.push({
          id: uuid,
          type: 'category',  // Default type
          target: ['variable', ['template-tag', name]],
          name,
          slug: name
        });
      }
    });

    return params;
  }

  /**
   * Wait for query to complete
   * @returns Promise resolving to execution result
   */
  private async waitForQueryCompletion(): Promise<{ success: boolean, error?: string }> {
    return new Promise((resolve) => {
      // Maximum wait time: 30 seconds
      const maxWaitTime = 30000;
      const startTime = Date.now();
      
      const checkInterval = setInterval(async () => {
        // Check if results are available
        const results = await this.getMetabaseState('qb.queryResults');
        
        // Check if there's an error
        const error = await this.getMetabaseState('qb.queryResults[0].error');
        
        // Check if the query is still running
        const isRunning = await this.getMetabaseState('qb.isRunning');
        
        if (error) {
          clearInterval(checkInterval);
          let errorMessage = '';
          
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.data) {
            errorMessage = error.data;
          } else if (error.status === 0) {
            errorMessage = 'Query timed out';
          } else {
            errorMessage = 'Unknown error';
          }
          
          resolve({ success: false, error: errorMessage });
        } else if (results && !isRunning) {
          clearInterval(checkInterval);
          resolve({ success: true });
        } else if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkInterval);
          resolve({ success: false, error: 'Query execution timed out' });
        }
      }, 200);
    });
  }

  /**
   * Get the run query button element
   * @returns Promise resolving to button element or null
   */
  private async getRunButton(): Promise<HTMLElement | null> {
    const runButtonSelector = getSelector('run_query_button');
    
    if (!runButtonSelector) {
      console.error('Run button selector not defined');
      return null;
    }
    
    if (runButtonSelector.type === 'CSS') {
      return document.querySelector(runButtonSelector.selector) as HTMLElement;
    } else {
      const result = document.evaluate(
        runButtonSelector.selector,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue as HTMLElement;
    }
  }

  /**
   * Generate a UUID for variables
   * @returns UUID string
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get state from Metabase's Redux store
   * @param path Path to retrieve from state
   * @returns Promise resolving to state value
   */
  private async getMetabaseState(path: string): Promise<any> {
    try {
      // Access Metabase's Redux store
      const store = (window as any).Metabase?.store;
      if (!store || !store.getState) {
        console.error('Metabase store not available');
        return null;
      }
      
      // Get state from path
      const state = store.getState();
      return this.getNestedProperty(state, path);
    } catch (error) {
      console.error('Error getting Metabase state:', error);
      return null;
    }
  }

  /**
   * Get a nested property from an object using dot notation
   * @param obj Object to get property from
   * @param path Path in dot notation
   * @returns Property value
   */
  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
      
      if (arrayMatch) {
        // Handle array access, e.g., 'queryResults[0]'
        const propName = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);
        
        if (!current[propName] || !current[propName][index]) {
          return undefined;
        }
        
        current = current[propName][index];
      } else {
        // Handle regular property access
        if (current === undefined || current === null) {
          return undefined;
        }
        
        current = current[part];
      }
    }
    
    return current;
  }

  /**
   * Dispatch an action to Metabase's Redux store
   * @param type Action type
   * @param payload Action payload
   */
  private async dispatchMetabaseAction(type: string, payload: any): Promise<void> {
    try {
      const store = (window as any).Metabase?.store;
      if (!store || !store.dispatch) {
        throw new Error('Metabase store not available');
      }
      
      store.dispatch({
        type,
        payload
      });
    } catch (error) {
      console.error('Error dispatching Metabase action:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const metabaseExecutor = new MetabaseExecutor(); 