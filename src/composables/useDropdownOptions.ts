import { computed, type ComputedRef } from 'vue';
import type { DropdownOption, ProvinceApiResponse, MunicipalityApiResponse, BarangayApiResponse } from '@/stores/options';

/**
 * Sort dropdown options alphabetically by label
 */
const sortByLabel = (items: DropdownOption[]): DropdownOption[] =>
  [...items]
    .filter((item) => item.label != null && item.label !== '')
    .sort((a, b) => (a.label || '').localeCompare(b.label || ''));

/**
 * Transform province API data into dropdown options
 */
export function useProvinceOptions(provinces: ComputedRef<unknown[]> | unknown[]): ComputedRef<DropdownOption[]> {
  const data = Array.isArray(provinces) ? computed(() => provinces) : provinces;

  return computed(() => {
    const items = data.value as ProvinceApiResponse[];
    return sortByLabel(
      items
        .filter((item) => item.name != null && item.name !== '')
        .map((item) => ({
          label: item.name,
          value: item.name
        }))
    );
  });
}

/**
 * Transform municipality API data into dropdown options
 * Optionally filter by province ID(s)
 */
export function useMunicipalityOptions(
  municipalities: ComputedRef<unknown[]> | unknown[],
  provinceId?: ComputedRef<string | number | undefined> | string | number | undefined
): ComputedRef<DropdownOption[]> {
  const data = Array.isArray(municipalities) ? computed(() => municipalities) : municipalities;
  const provinceFilter = typeof provinceId === 'object' ? provinceId : computed(() => provinceId);

  return computed(() => {
    const items = data.value as MunicipalityApiResponse[];
    let filtered = items.filter((item) => item.name != null && item.name !== '');

    // Apply province filter if provided
    if (provinceFilter.value != null) {
      const targetProvinceId = Number(provinceFilter.value);
      filtered = filtered.filter((item) => item.province_id === targetProvinceId);
    }

    return sortByLabel(
      filtered.map((item) => ({
        label: item.name,
        value: String(item.id),
        province_id: item.province_id,
        province_name: item.province_name
      }))
    );
  });
}

/**
 * Transform barangay API data into dropdown options
 * Optionally filter by municipality ID(s)
 */
export function useBarangayOptions(
  barangays: ComputedRef<unknown[]> | unknown[],
  municipalityId?: ComputedRef<string | number | undefined> | string | number | undefined
): ComputedRef<DropdownOption[]> {
  const data = Array.isArray(barangays) ? computed(() => barangays) : barangays;
  const municipalityFilter =
    typeof municipalityId === 'object' ? municipalityId : computed(() => municipalityId);

  return computed(() => {
    const items = data.value as BarangayApiResponse[];
    let filtered = items.filter((item) => item.name != null && item.name !== '');

    // Apply municipality filter if provided
    if (municipalityFilter.value != null) {
      const targetMunicipalityId = Number(municipalityFilter.value);
      filtered = filtered.filter((item) => item.municipality_id === targetMunicipalityId);
    }

    return sortByLabel(
      filtered.map((item) => ({
        label: item.name,
        value: String(item.id),
        province_name: item.province_name,
        municipality_name: item.municipality_name
      }))
    );
  });
}

/**
 * Generic dropdown option transformer
 * Transform any array of objects into dropdown options
 */
export function useGenericOptions<T extends Record<string, any>>(
  data: ComputedRef<T[]> | T[],
  config: {
    labelField: keyof T;
    valueField: keyof T;
    filterField?: keyof T;
    filterValue?: ComputedRef<any> | any;
    extraFields?: (keyof T)[];
  }
): ComputedRef<DropdownOption[]> {
  const items = Array.isArray(data) ? computed(() => data) : data;
  const filterVal = typeof config.filterValue === 'object' ? config.filterValue : computed(() => config.filterValue);

  return computed(() => {
    let filtered = items.value.filter(
      (item) => item[config.labelField] != null && item[config.labelField] !== ''
    );

    // Apply filter if provided
    if (config.filterField && filterVal.value != null) {
      filtered = filtered.filter((item) => item[config.filterField!] === filterVal.value);
    }

    return sortByLabel(
      filtered.map((item) => {
        const option: DropdownOption = {
          label: String(item[config.labelField]),
          value: String(item[config.valueField])
        };

        // Include extra fields if specified
        if (config.extraFields) {
          config.extraFields.forEach((field) => {
            (option as any)[field] = item[field];
          });
        }

        return option;
      })
    );
  });
}
