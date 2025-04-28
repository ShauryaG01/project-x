/**
 * Storage Module
 * 
 * Provides storage functionality for the application
 */

// Mock settings for development
const mockSettings = {
  primaryProvider: 'openai',
  openaiApiKey: '',
  anthropicApiKey: ''
};

/**
 * Storage service singleton
 */
export const storage = {
  settings: {
    /**
     * Get settings
     */
    async get() {
      return mockSettings;
    },

    /**
     * Save settings
     */
    async save(newSettings: any) {
      Object.assign(mockSettings, newSettings);
      return true;
    }
  }
}; 