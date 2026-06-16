import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchMPA, fetchPendingMPAs, fetchPendingMPA, fetchMyMPAs } from '@/api/mpa';
import type { EditFieldDef } from '@/types/edit';

type MpaRecord = Record<string, unknown>;

export const editFields: EditFieldDef[] = [
  { key: 'complete_name', component: 'InputTextField', props: { placeholder: 'Enter MPA name' } },
  { key: 'year_established', component: 'InputTextField', props: { type: 'number', placeholder: 'e.g., 2006' } },
  { key: 'date_established', component: 'InputTextField', props: { type: 'date', placeholder: 'YYYY-MM-DD' } },
  { key: 'type', component: 'InputTextField', props: { type: 'number', placeholder: 'Enter type' } },
  { key: 'status', component: 'InputTextField', props: { placeholder: 'Enter status' } },
  { key: 'province', component: 'DropdownField', props: { options: [], placeholder: 'Select province' } },
  {
    key: 'municipality',
    component: 'DropdownField',
    props: (payload) => ({ options: [], placeholder: 'Select municipality', disabled: !payload.province })
  },
  {
    key: 'barangay',
    component: 'DropdownField',
    props: (payload) => ({ options: [], placeholder: 'Select barangay', disabled: !payload.municipality })
  },
  { key: 'core_area', component: 'InputTextField', props: { type: 'number', placeholder: 'Enter core area' } },
  { key: 'buffer_area', component: 'InputTextField', props: { type: 'number', placeholder: 'Enter buffer area' } },
  { key: 'total_area', component: 'InputTextField', props: { type: 'number', placeholder: 'Enter total area' } },
  { key: 'latitude', component: 'InputTextField', props: { type: 'number', step: '0.0001', placeholder: 'e.g., 15.7582' } },
  { key: 'longitude', component: 'InputTextField', props: { type: 'number', step: '0.0001', placeholder: 'e.g., 121.625' } },
  { key: 'mgt_body', component: 'InputTextField', props: { placeholder: 'Enter management body' } },
  { key: 'mpa_plan', component: 'InputTextField', props: { placeholder: 'Enter MPA plan' } },
  { key: 'network', component: 'InputTextField', props: { placeholder: 'Enter network' } },
  { key: 'remarks', component: 'InputTextField', props: { placeholder: 'Enter remarks' } }
];

export const useMPAStore = defineStore('mpa', () => {
  const mpaData = ref<MpaRecord | null>(null);
  const pendingMPAs = ref<any[]>([]);
  const pendingMpaData = ref<MpaRecord | null>(null);
  const loading = ref(false);
  const loadingPending = ref(false);

  async function loadMpa(id: string) {
    loading.value = true;
    try {
      const response = await fetchMPA(id);
      const data = response.data ?? null;
      mpaData.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function loadPendingMPAs() {
    loadingPending.value = true;
    try {
      const response = await fetchPendingMPAs();

      // The response structure is: { data: { success: true, count: number, data: [...] } }
      // So response.data = { success, count, data }
      // And response.data.data = the array we want
      let items = [];
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.data)) {
          items = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Fallback: maybe the data is directly in response.data
          items = response.data;
        }
      }

      pendingMPAs.value = items;
      return items;
    } catch (error: any) {
      console.error('Error loading pending MPAs:', error);
      pendingMPAs.value = [];
      return [];
    } finally {
      loadingPending.value = false;
    }
  }

  async function loadPendingMpa(stagingId: string | number) {
    loading.value = true;
    try {
      let data: MpaRecord | null = null;
      try {
        const response = await fetchPendingMPA(stagingId);
        data = (response.data && typeof response.data === 'object' && 'data' in response.data)
          ? (response.data as Record<string, unknown>).data as MpaRecord ?? null
          : response.data ?? null;
      } catch {
        // Fallback: find the item from my-mpas (staging items use 'id', not 'staging_id')
        const myResp = await fetchMyMPAs();
        const staging: MpaRecord[] = myResp.data?.staging ?? [];
        const match = staging.find(
          (item) => String(item.staging_id ?? item.id) === String(stagingId)
        ) ?? null;
        if (match) {
          const rawOrdinances = (match.ordinances as Array<Record<string, unknown>>) ?? [];
          const ordinances = rawOrdinances
            .filter(o => o.id != null)
            .map(o => ({ id: o.id, val: o.name ?? o.val, attach: o.link ?? o.attach, year: o.year ?? null, type: o.type ?? null }));
          data = {
            staging_id: match.staging_id ?? match.id,
            complete_name: match.complete_name,
            type: match.type,
            status: match.upload_status ?? 'pending',
            year_established: match.year_established,
            date_established: match.date_established,
            province: match.province,
            municipality: match.municipality,
            barangay: match.barangay,
            total_area: match.total_area,
            core_area: match.core_area,
            buffer_area: match.buffer_area,
            latitude: match.latitude,
            longitude: match.longitude,
            mgt_body: match.mgt_body,
            mpa_plan: match.mpa_plan,
            network: match.network,
            remarks: match.remarks,
            is_nipas: match.is_nipas,
            uploaded_by: match.uploaded_by,
            rejection_reason: match.rejection_reason,
            ordinances
          };
        }
      }
      pendingMpaData.value = data;
      return data;
    } catch (error) {
      console.error('Error loading pending MPA:', error);
      pendingMpaData.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  function clearPending() {
    pendingMPAs.value = [];
    pendingMpaData.value = null;
  }

  return {
    mpaData,
    pendingMPAs,
    pendingMpaData,
    loading,
    loadingPending,
    loadMpa,
    loadPendingMPA: loadPendingMpa,
    loadPendingMPAs,
    clearPending
  };
});
