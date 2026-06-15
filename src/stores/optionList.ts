/**
 * Option List Configuration
 *
 * Defines which options should be loaded together for specific scenarios.
 * Each key represents a scenario, and its value is an array of option keys
 * that should be fetched together.
 *
 * Example usage in a component:
 * ```
 * const optionsStore = useOptionsStore();
 * await optionsStore.getAll('mpaLocation'); // Loads provinces, municipalities, barangays
 * ```
 */
export const optionList = {
  mpaLocation: [
    'provinces',
    'municipalities',
    'barangays'
  ]
  // Add more scenarios as needed, e.g.:
  // userManagement: ['roles', 'permissions'],
  // reporting: ['reportTypes', 'dateRanges'],
};

/**
 * Option Endpoints Configuration
 *
 * Maps option keys to their corresponding API endpoints.
 * These endpoints are used by the options store to fetch data.
 */
export const optionEndpoints = {
  provinces: '/provinces',
  municipalities: '/municipalities',
  barangays: '/barangays'
  // Add more endpoints as needed
};
