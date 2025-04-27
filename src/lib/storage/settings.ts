/**
 * User Settings Storage Operations
 * 
 * This module provides functions for managing user settings in IndexedDB.
 */

import { getDB } from './db';
import { UserSettings, StorageError, StorageErrorType } from '../../types/storage';

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  maxHistoryItems: 50,
  enableHistory: true,
  primaryProvider: 'openai',
  shareUsageStats: true,
  storeQueriesLocally: true,
};

// Setting key in the store
const SETTINGS_KEY = 'user-settings';

// Interface for setting items stored in the database
interface SettingItem {
  key: string;
  value: UserSettings[keyof UserSettings];
}

/**
 * Get all user settings
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const db = await getDB();
    const tx = db.transaction('settings');
    const settingsStore = tx.objectStore('settings');
    const items = await settingsStore.getAll();
    
    // If no settings found, initialize with defaults
    if (!items || items.length === 0) {
      await initializeSettings();
      return DEFAULT_SETTINGS;
    }
    
    // Convert array of {key, value} to a single settings object
    const settingsObj: Partial<UserSettings> = {};
    
    items.forEach((item: any) => {
      if (item && typeof item === 'object' && 'key' in item && 'value' in item) {
        settingsObj[item.key as keyof UserSettings] = item.value;
      }
    });
    
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_SETTINGS, ...settingsObj };
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw new StorageError('Failed to retrieve settings', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Get a specific setting value
 */
export async function getSetting<K extends keyof UserSettings>(key: K): Promise<UserSettings[K]> {
  try {
    const db = await getDB();
    const result = await db.get('settings', key) as any;
    
    if (!result || typeof result !== 'object' || !('value' in result)) {
      // Return default if not found
      return DEFAULT_SETTINGS[key];
    }
    
    return result.value as UserSettings[K];
  } catch (error) {
    console.error(`Failed to get setting ${key}:`, error);
    throw new StorageError(`Failed to retrieve setting ${key}`, StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Update settings
 */
export async function updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const db = await getDB();
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    
    // Save each setting individually
    for (const [key, value] of Object.entries(updates)) {
      const settingItem = {
        key,
        value: value as UserSettings[keyof UserSettings],
      };
      // Use type assertion to work around type constraints
      await (store as any).put(settingItem);
    }
    
    await tx.done;
    
    // Return updated settings
    return await getSettings();
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw new StorageError('Failed to update settings', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Update a single setting
 */
export async function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): Promise<UserSettings> {
  return updateSettings({ [key]: value } as Partial<UserSettings>);
}

/**
 * Initialize settings with defaults
 */
export async function initializeSettings(): Promise<UserSettings> {
  return updateSettings(DEFAULT_SETTINGS);
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<UserSettings> {
  try {
    const db = await getDB();
    await db.clear('settings');
    return initializeSettings();
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw new StorageError('Failed to reset settings', StorageErrorType.TRANSACTION_FAILED);
  }
}

/**
 * Delete a specific setting (revert to default)
 */
export async function deleteSetting<K extends keyof UserSettings>(key: K): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('settings', key);
  } catch (error) {
    console.error(`Failed to delete setting ${key}:`, error);
    throw new StorageError(`Failed to delete setting ${key}`, StorageErrorType.TRANSACTION_FAILED);
  }
}

// Export default object for easier importing
export default {
  get: getSettings,
  getSingle: getSetting,
  update: updateSettings,
  updateSingle: updateSetting,
  initialize: initializeSettings,
  reset: resetSettings,
  delete: deleteSetting,
  defaults: DEFAULT_SETTINGS,
};