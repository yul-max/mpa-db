import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePointsStore = defineStore('points', () => {
  const selectedSeverity = ref<string>('All');
  const selectedYear = ref<string | number>('All');
  const mpa = ref<boolean>(true);
  const coral_bleach = ref<boolean>(false);
  const mermaid = ref<boolean>(false);
  const nipas = ref<number | null>(null);
  const ecosystems = ref<string | number>('All');
  const mpaMinYear = ref<number | null>(null);
  const mpaMaxYear = ref<number | null>(null);
  const loading = ref<boolean>(false);

  return {
    selectedSeverity,
    selectedYear,
    mpa,
    coral_bleach,
    mermaid,
    nipas,
    ecosystems,
    mpaMinYear,
    mpaMaxYear,
    loading
  };
});
