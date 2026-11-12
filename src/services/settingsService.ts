/**
 * Padula Sports - Tournament Analytics
 * Settings Service Layer
 * 
 * Provides an isolated data-access abstraction for application settings.
 * Currently backed by localStorage with integrity checks and versioning.
 * 
 * ── Backend Swap Note ────────────────────────────────────────────────────────
 * To connect to a live backend (e.g. Supabase, PostgreSQL, or REST API):
 * Replace the localStorage calls in getSettings() and updateSettings()
 * with your asynchronous API calls (e.g., `supabase.from('settings').select('*')`).
 * The interface contracts and typing will remain identical across the application.
 */

import type { AppSettings } from '../types/settings';
import { DEFAULT_APP_SETTINGS } from '../constants/defaultSettings';

const SETTINGS_STORAGE_KEY = 'padula_tournament_settings_v1';

/**
 * Deep merge utility to safely apply partial updates without losing nested properties.
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal !== undefined &&
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      output[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      output[key] = sourceVal as any;
    }
  }
  return output;
}

/**
 * Retrieve current settings from storage or fall back to system defaults.
 */
export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      // First run: save defaults
      saveToStorage(DEFAULT_APP_SETTINGS);
      return DEFAULT_APP_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    // Merge with defaults in case new fields were introduced in an app update
    return deepMerge(DEFAULT_APP_SETTINGS, parsed);
  } catch (err) {
    console.error('[SettingsService] Failed to load settings from storage. Falling back to defaults.', err);
    return DEFAULT_APP_SETTINGS;
  }
}

/**
 * Save settings to persistence storage.
 */
function saveToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('[SettingsService] Failed to persist settings to storage.', err);
  }
}

/**
 * Update global settings or specific sections.
 */
export function updateSettings(
  partial: Partial<AppSettings>,
  updatedBy: string = 'Authorized Staff'
): AppSettings {
  const current = getSettings();
  const updated: AppSettings = {
    ...deepMerge(current, partial),
    lastUpdated: new Date().toISOString(),
    updatedBy,
  };
  saveToStorage(updated);
  return updated;
}

/**
 * Update a specific section of settings (e.g. 'sportsCompetition', 'scoring', etc.).
 */
export function updateSettingsSection<K extends keyof AppSettings>(
  sectionKey: K,
  sectionData: AppSettings[K],
  updatedBy: string = 'Authorized Staff'
): AppSettings {
  const current = getSettings();
  const updated: AppSettings = {
    ...current,
    [sectionKey]: sectionData,
    lastUpdated: new Date().toISOString(),
    updatedBy,
  };
  saveToStorage(updated);
  return updated;
}

/**
 * Reset all settings to Asian College Padula defaults.
 */
export function resetSettings(updatedBy: string = 'System Reset'): AppSettings {
  const reset: AppSettings = {
    ...DEFAULT_APP_SETTINGS,
    lastUpdated: new Date().toISOString(),
    updatedBy,
  };
  saveToStorage(reset);
  return reset;
}

/**
 * Reset a single section to its default values.
 */
export function resetSection<K extends keyof AppSettings>(
  sectionKey: K,
  updatedBy: string = 'System Reset'
): AppSettings {
  const current = getSettings();
  const updated: AppSettings = {
    ...current,
    [sectionKey]: DEFAULT_APP_SETTINGS[sectionKey],
    lastUpdated: new Date().toISOString(),
    updatedBy,
  };
  saveToStorage(updated);
  return updated;
}

/**
 * Export complete settings as a formatted JSON string for backup.
 */
export function exportSettings(): string {
  const current = getSettings();
  return JSON.stringify(current, null, 2);
}

/**
 * Import settings from a JSON string with schema validation.
 */
export function importSettings(
  jsonString: string,
  updatedBy: string = 'JSON Import'
): { success: boolean; error?: string; settings?: AppSettings } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON payload: Root must be an object.' };
    }
    // Verify core structure
    const requiredSections = [
      'sportsCompetition',
      'rosterRules',
      'statsMetrics',
      'scoring',
      'security',
      'dashboards',
      'publicDisplay',
      'system',
    ];
    for (const section of requiredSections) {
      if (!parsed[section] || typeof parsed[section] !== 'object') {
        return { success: false, error: `Invalid settings format: Missing required section "${section}".` };
      }
    }

    const validated: AppSettings = {
      ...deepMerge(DEFAULT_APP_SETTINGS, parsed),
      lastUpdated: new Date().toISOString(),
      updatedBy,
    };

    saveToStorage(validated);
    return { success: true, settings: validated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse JSON settings file.' };
  }
}

