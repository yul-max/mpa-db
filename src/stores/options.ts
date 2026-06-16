import { defineStore } from 'pinia';
import { ref } from 'vue';
import { optionList, optionEndpoints } from './optionList';
import api from '@/api';

// API response types
export type ProvinceApiResponse = {
  id: number;
  name: string;
  psgc_code: string;
  coor_code?: string;
  coor_code_clean?: string;
};
export type MunicipalityApiResponse = {
  id: number;
  name: string;
  province_id?: number;
  province_name?: string;
  psgc_code: string;
  coor_code?: string;
  coor_code_clean?: string;
};
export type BarangayApiResponse = {
  id: number;
  name: string;
  municipality_id?: number;
  municipality_name?: string;
  province_id?: number;
  province_name?: string;
  psgc_code: string;
  coor_code?: string;
  coor_code_clean?: string;
};
export type ManagementBodyOption = { mgt_body: string; mgt_body_count: number };
export type DropdownOption = {
  label: string;
  value: string;
  count?: number;
  province?: string | number;
  province_id?: number;
  province_name?: string;
  municipality?: string | number;
  municipality_name?: string;
};

export const useOptionsStore = defineStore('options', () => {
  // Centralized options object - fully dynamic (renamed to avoid naming collision)
  const _optionsData = ref<Record<string, unknown[]>>({});

  const loading = ref(false);

  // Track which option sets have been loaded
  const loadedOptions = ref<Set<string>>(new Set());

  /**
   * Fetch a single option from an endpoint
   */
  const fetchOption = async (endpoint: string) => {
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error fetching options from ${endpoint}:`, error);
      return [];
    }
  };

  /**
   * Get configuration mapping for a specific scenario (e.g., 'mpaLocation')
   * Returns an object mapping option keys to their API endpoints
   */
  const getOptionConfig = (configName: string): Record<string, string> => {
    const optionKeys = optionList[configName as keyof typeof optionList];
    if (!optionKeys) return {};

    const config: Record<string, string> = {};
    optionKeys.forEach((key) => {
      const endpoint = optionEndpoints[key as keyof typeof optionEndpoints];
      if (endpoint) {
        config[key] = endpoint;
      }
    });

    return config;
  };

  /**
   * Fetch all options for a specific scenario, using cache when available
   * @param configName - The scenario name from optionList (e.g., 'mpaLocation')
   * @param force - Force re-fetch even if already loaded
   */
  const getAll = async (configName: string, force = false) => {
    // Skip if already loaded and not forcing refresh
    if (loadedOptions.value.has(configName) && !force) {
      return;
    }

    const config = getOptionConfig(configName);
    if (Object.keys(config).length === 0) {
      console.warn(`No configuration found for: ${configName}`);
      return;
    }

    loading.value = true;
    try {
      // Fetch all options in parallel
      const requests = Object.entries(config).map(async ([key, endpoint]) => {
        const data = await fetchOption(endpoint);
        // Store data in the options object
        _optionsData.value[key] = Array.isArray(data) ? data : [];
      });

      await Promise.all(requests);

      // Mark this config as loaded
      loadedOptions.value.add(configName);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Legacy method for backward compatibility
   * Fetches provinces, municipalities, and barangays
   * Uses cache if already loaded
   */
  async function fetchOptions(force = false) {
    await getAll('mpaLocation', force);
    return {
      provinces: _optionsData.value.provinces,
      municipalities: _optionsData.value.municipalities,
      barangays: _optionsData.value.barangays
    };
  }

  /**
   * Clear all cached options and force re-fetch on next request
   */
  function clearCache(configName?: string) {
    if (configName) {
      loadedOptions.value.delete(configName);
    } else {
      loadedOptions.value.clear();
      _optionsData.value = {};
    }
  }

  return {
    options: _optionsData,
    loading,
    fetchOptions,
    getAll,
    clearCache
  };
});
