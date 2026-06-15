<template>
  <Details
    :data="currentData"
    :loading="loading"
    :title="detailsTitle"
    :subtitle="detailsSubtitle"
    :sections="mpaDetailsSections"
    :tabs="mpaDetailsTabs"
    :edit-fields="editFieldsWithOptions"
    :edit-model="editPayload"
    back-link="/mpa"
    back-label="Back to MPAs"
    :mode="isEditing ? 'edit' : 'view'"
    :show-edit="!isPending"
    :disable-save="isSaving || !isEditDirty"
    @edit="startEdit"
    @cancel="requestCancelEdit"
    @save="saveEdit"
  >
    <template #actions>
      <div v-if="isPending && !isEditing" class="pending-actions">
        <Dropdown
          icon="bars"
          title="Actions"
          :items="pendingActionItems"
        />
      </div>
    </template>

    <template #subtitle-actions>
      <span
        v-if="currentData && currentData.latitude && currentData.longitude"
        class="map-link"
        @click="showMapModal = true"
        title="Show location on map"
      >
        <FontAwesomeIcon :icon="['fas', 'location-arrow']" /> Show in map
      </span>
    </template>

    <template #tab-history>
      <div class="ordinance-history">
        <div v-if="ordinancesLoading" class="ordinance-loading">Loading history...</div>
        <DataTable
          v-else
          :value="ordinances"
          sort-field="year"
          :sort-order="-1"
          class="ordinance-table"
          striped-rows
        >
          <Column field="year" header="Year" sortable style="width: 90px" />
          <Column field="type" header="Type" sortable style="width: 130px">
            <template #body="{ data: row }">
              {{ ordinanceTypeLabel(row.type) }}
            </template>
          </Column>
          <Column field="val" header="Title">
            <template #body="{ data: row }">
              <a
                v-if="row.attach"
                class="ordinance-link"
                @click.prevent="openFilePreview(row)"
              >{{ row.val }}</a>
              <span v-else>{{ row.val }}</span>
            </template>
          </Column>
          <!-- Download column hidden until further notice -->
        </DataTable>
        <div v-if="!ordinancesLoading && ordinances.length === 0" class="ordinance-empty">
          No history records found.
        </div>
      </div>
    </template>
  </Details>

  <ConfirmModal
    :open="confirmOpen"
    title="Discard changes?"
    message="You have unsaved changes. Discard them?"
    confirm-label="Discard"
    cancel-label="Keep editing"
    @confirm="confirmDiscard"
    @cancel="confirmOpen = false"
  />

  <ConfirmModal
    :open="externalLinkConfirmOpen"
    title="Open External Website?"
    message="This link points outside mandaragat.org and may redirect you to an external website. Continue?"
    confirm-label="Continue"
    cancel-label="Cancel"
    @confirm="confirmOpenExternalLink"
    @cancel="cancelOpenExternalLink"
  />

  <ConfirmModal
    :open="approveModalOpen"
    :title="`Approve MPA: ${approvingMPAName}`"
    message="Are you sure you want to approve this MPA? This will publish it to the main database."
    confirm-label="Approve MPA"
    cancel-label="Cancel"
    @confirm="confirmApprove"
    @cancel="cancelApprove"
  />

  <ConfirmModal
    :open="rejectModalOpen"
    :title="`Reject MPA: ${rejectingMPAName}`"
    message="Please provide a reason for rejecting this MPA. The uploader will be notified via email."
    confirm-label="Reject MPA"
    cancel-label="Cancel"
    :disable-confirm="!rejectionReason.trim()"
    @confirm="confirmReject"
    @cancel="cancelReject"
  >
    <template #content>
      <div class="rejection-reason-field">
        <label for="rejection-reason" class="reason-label">Rejection Reason</label>
        <textarea
          id="rejection-reason"
          v-model="rejectionReason"
          class="reason-textarea"
          placeholder="Enter the reason for rejection..."
          rows="4"
        />
      </div>
    </template>
  </ConfirmModal>

  <ConfirmModal
    :open="messageModalOpen"
    :title="messageModalTitle"
    :message="messageModalContent"
    :confirm-label="'OK'"
    :cancel-label="''"
    @confirm="messageModalOpen = false"
    @cancel="messageModalOpen = false"
  />

  <MapModal
    :open="showMapModal"
    :title="`${detailsTitle} - Location`"
    :latitude="(currentData?.latitude as number | null | undefined)"
    :longitude="(currentData?.longitude as number | null | undefined)"
    :mpa-name="detailsTitle"
    :mpa-id="(currentData?.id as number | string | null | undefined)"
    @close="showMapModal = false"
  />

  <Teleport to="body">
    <div v-if="previewUrl" class="file-preview-overlay" @click.self="closePreview">
      <div class="file-preview-card">
        <div class="file-preview-header">
          <h3 class="file-preview-title">{{ previewTitle }}</h3>
          <div class="file-preview-actions">
            <!-- Download disabled -->
            <button class="file-preview-close" @click="closePreview" aria-label="Close">
              <FontAwesomeIcon :icon="['fas', 'times']" />
            </button>
          </div>
        </div>
        <div class="file-preview-body">
          <template v-if="previewUrl">
            <img
              v-if="previewFileType === 'image'"
              :src="previewUrl"
              class="file-preview-image"
              alt="File preview"
            />
            <embed
              v-else-if="previewFileType === 'pdf'"
              :src="previewUrl"
              type="application/pdf"
              class="file-preview-embed"
            />
            <div v-else class="file-preview-unsupported">
              <p>Inline preview is not available for this file type.</p>
              <a :href="previewUrl"
                download
                target="_blank"
                class="file-preview-download"
              >
                <FontAwesomeIcon :icon="['fas', 'download']" /> Download file
              </a>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, type RouteLocationRaw } from 'vue-router';
import { storeToRefs } from 'pinia';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Details from '@/components/ui/Details.vue';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';
import MapModal from '@/components/ui/MapModal.vue';
import Dropdown from '@/components/ui/Dropdown.vue';
import type { DropdownItem } from '@/types/dropdown';
import { useMPAStore, editFields } from '@/stores/mpa';
import { updateMPA, fetchOrdinances, approvePendingMPA, rejectPendingMPA } from '@/api/mpa';
import { useOptionsStore, type ProvinceApiResponse, type MunicipalityApiResponse, type BarangayApiResponse } from '@/stores/options';
import { useProvinceOptions, useMunicipalityOptions, useBarangayOptions } from '@/composables/useDropdownOptions';
import { useUsersStore } from '@/stores/users';

interface FieldConfig {
  key: string;
  label: string;
  fullWidth?: boolean;
  type?: 'text' | 'number' | 'boolean' | 'date';
  formatter?: (value: any) => string;
}

interface SectionConfig {
  title: string;
  fields: FieldConfig[];
}

interface Ordinance {
  id: number;
  mpa_id: number;
  year: number;
  val: string;
  type: number;
  attach: string | null;
}


const route = useRoute();
const router = useRouter();
const mpaStore = useMPAStore();
const { mpaData, pendingMpaData, loading } = storeToRefs(mpaStore);
const optionsStore = useOptionsStore();
const usersStore = useUsersStore();
const { list: usersList } = storeToRefs(usersStore);

// Detect if this is a pending MPA based on route
const isPending = computed(() => route.meta.pending === true || route.name === 'mpas-pending-details');

// Use the appropriate data source
const currentData = computed(() => isPending.value ? pendingMpaData.value : mpaData.value);

// Get raw options from store
const provinces = computed(() => (optionsStore.options.provinces || []) as ProvinceApiResponse[]);
const municipalities = computed(() => (optionsStore.options.municipalities || []) as MunicipalityApiResponse[]);
const barangays = computed(() => (optionsStore.options.barangays || []) as BarangayApiResponse[]);

// Transform to dropdown options
const provinceOptions = useProvinceOptions(provinces);

const isEditing = ref(false);
const isSaving = ref(false);
const editPayload = ref<Record<string, any>>({});
const originalEditPayload = ref<Record<string, any>>({});
const showMapModal = ref(false);
const confirmOpen = ref(false);
const pendingRoute = ref<RouteLocationRaw | null>(null);

const ordinances = ref<Ordinance[]>([]);
const ordinancesLoading = ref(false);
const previewUrl = ref<string | null>(null);
const previewTitle = ref('');
const externalLinkConfirmOpen = ref(false);
const pendingExternalLink = ref<string | null>(null);

const rejectModalOpen = ref(false);
const rejectingStagingId = ref<number | null>(null);
const rejectingMPAName = ref('');
const rejectionReason = ref('');

const approveModalOpen = ref(false);
const approvingStagingId = ref<number | null>(null);
const approvingMPAName = ref('');

const messageModalOpen = ref(false);
const messageModalTitle = ref('');
const messageModalContent = ref('');

const previewFileType = computed((): 'pdf' | 'image' | 'unsupported' => {
  const lower = (previewUrl.value ?? '').toLowerCase().replace(/\?.*$/, '');
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/.test(lower)) return 'image';
  return 'unsupported';
});

const ordinanceTypeLabel = (type: number): string => {
  const labels: Record<number, string> = { 1: 'Legislation', 2: 'Remarks', 3: 'Award' };
  return labels[type] ?? 'Unknown';
};

const openFilePreview = (row: Ordinance) => {
  if (!row.attach) return;

  // Only mandaragat links are opened inline. External links require confirmation.
  if (!isMandaragatLink(row.attach)) {
    pendingExternalLink.value = row.attach;
    externalLinkConfirmOpen.value = true;
    return;
  }

  previewTitle.value = row.val;
  previewUrl.value = row.attach;
};

const isMandaragatLink = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'mandaragat.org' || parsed.hostname.endsWith('.mandaragat.org');
  } catch {
    return false;
  }
};

const confirmOpenExternalLink = () => {
  const target = pendingExternalLink.value;
  externalLinkConfirmOpen.value = false;
  pendingExternalLink.value = null;
  if (target) {
    window.open(target, '_blank', 'noopener,noreferrer');
  }
};

const cancelOpenExternalLink = () => {
  externalLinkConfirmOpen.value = false;
  pendingExternalLink.value = null;
};

const closePreview = () => {
  previewUrl.value = null;
  previewTitle.value = '';
};

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && previewUrl.value) closePreview();
};

const handlePendingEdit = () => {
  startEdit();
};

const handlePendingApprove = () => {
  const stagingId = Number(currentData.value?.staging_id ?? route.params.id);
  approvingStagingId.value = Number.isFinite(stagingId) ? stagingId : null;
  approvingMPAName.value = String(currentData.value?.complete_name ?? `ID ${route.params.id}`);
  approveModalOpen.value = true;
};

const handlePendingReject = () => {
  const stagingId = Number(currentData.value?.staging_id ?? route.params.id);
  rejectingStagingId.value = Number.isFinite(stagingId) ? stagingId : null;
  rejectingMPAName.value = String(currentData.value?.complete_name ?? `ID ${route.params.id}`);
  rejectionReason.value = '';
  rejectModalOpen.value = true;
};

const pendingActionItems = computed<DropdownItem[]>(() => [
  {
    icon: 'pen-to-square',
    title: 'Edit',
    handler: handlePendingEdit
  },
  {
    icon: 'check',
    title: 'Approve',
    handler: handlePendingApprove
  },
  {
    icon: 'x',
    title: 'Reject',
    handler: handlePendingReject
  }
]);

const confirmApprove = async () => {
  if (!approvingStagingId.value) return;

  approveModalOpen.value = false;
  try {
    const response = await approvePendingMPA(approvingStagingId.value);
    if (response.data.success) {
      messageModalTitle.value = 'MPA Approved';
      messageModalContent.value = `MPA approved successfully! New MPA ID: ${response.data.new_mpa_id}`;
      messageModalOpen.value = true;
      await router.push({ name: 'mpas-list' });
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || 'Failed to approve MPA';
    messageModalTitle.value = 'Approval Failed';
    messageModalContent.value = errorMsg;
    messageModalOpen.value = true;
  } finally {
    approvingStagingId.value = null;
    approvingMPAName.value = '';
  }
};

const cancelApprove = () => {
  approveModalOpen.value = false;
  approvingStagingId.value = null;
  approvingMPAName.value = '';
};

const confirmReject = async () => {
  if (!rejectionReason.value.trim() || !rejectingStagingId.value) return;

  try {
    const response = await rejectPendingMPA(rejectingStagingId.value, rejectionReason.value.trim());
    if (response.data.success) {
      rejectModalOpen.value = false;
      rejectingStagingId.value = null;
      rejectingMPAName.value = '';
      rejectionReason.value = '';

      messageModalTitle.value = 'MPA Rejected';
      messageModalContent.value = 'MPA rejected successfully. The uploader will be notified via email.';
      messageModalOpen.value = true;
      await router.push({ name: 'mpas-list' });
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || 'Failed to reject MPA';
    messageModalTitle.value = 'Rejection Failed';
    messageModalContent.value = errorMsg;
    messageModalOpen.value = true;
  }
};

const cancelReject = () => {
  rejectModalOpen.value = false;
  rejectingStagingId.value = null;
  rejectingMPAName.value = '';
  rejectionReason.value = '';
};

const detailsTitle = computed(() => {
  const source = isEditing.value ? editPayload.value : currentData.value;
  return source?.complete_name || (isPending.value ? 'Pending MPA Details' : 'MPA Details');
});

// Helper to format timestamp to human-readable date
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';

    // Format as "Month Day, Year" (e.g., "January 15, 2024")
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

const detailsSubtitle = computed(() => {
  const source = isEditing.value ? editPayload.value : currentData.value;
  if (!source) return '';

  const locationParts: string[] = [];
  if (source.barangay) locationParts.push(`Brgy. ${source.barangay}`);
  if (source.municipality) locationParts.push(source.municipality);
  if (source.province) locationParts.push(source.province);

  let subtitle = '';
  if (locationParts.length > 0) {
    subtitle = locationParts.join(', ');
  }

  // Touch usersList to make this computed reactive to user store changes
  void usersList.value;

  if (isPending.value) {
    const uploadedByName = usersStore.getUserFullName(source.uploaded_by);
    return `${subtitle}\nStatus: Pending Approval\nUploaded by: ${uploadedByName}`;
  }

  const uploadedByName = usersStore.getUserFullName(source.uploaded_by);
  const approvedByName = usersStore.getUserFullName(source.approved_by);
  const approvedAt = formatDate(source.approved_at);
  return `${subtitle}\nUploaded by: ${uploadedByName}\nApproved by: ${approvedByName} at ${approvedAt}`;
});

const toFormValue = (value: unknown) => (value === null || value === undefined ? '' : value);

const buildEditPayload = (data: Record<string, any>) => ({
  complete_name: toFormValue(data.complete_name),
  year_established: toFormValue(data.year_established),
  date_established: toFormValue(data.date_established),
  type: toFormValue(data.type),
  status: toFormValue(data.status),
  province: toFormValue(data.province),
  municipality: toFormValue(data.municipality),
  barangay: toFormValue(data.barangay),
  core_area: toFormValue(data.core_area),
  buffer_area: toFormValue(data.buffer_area),
  total_area: toFormValue(data.total_area),
  longitude: toFormValue(data.longitude),
  latitude: toFormValue(data.latitude),
  remarks: toFormValue(data.remarks),
  mgt_body: toFormValue(data.mgt_body),
  mpa_plan: toFormValue(data.mpa_plan),
  network: toFormValue(data.network)
});

const clonePayload = (payload: Record<string, any>) =>
  JSON.parse(JSON.stringify(payload)) as Record<string, any>;

const normalizeNumber = (value: unknown) => (value === '' ? null : Number(value));
const normalizeText = (value: unknown) => (value === '' ? null : value);

const buildSubmitPayload = (data: Record<string, any>) => ({
  province: normalizeText(data.province),
  municipality: normalizeText(data.municipality),
  barangay: normalizeText(data.barangay),
  core_area: normalizeNumber(data.core_area),
  buffer_area: normalizeNumber(data.buffer_area),
  total_area: normalizeNumber(data.total_area),
  longitude: normalizeNumber(data.longitude),
  latitude: normalizeNumber(data.latitude),
  status: normalizeText(data.status),
  remarks: normalizeText(data.remarks),
  mgt_body: normalizeText(data.mgt_body),
  mpa_plan: normalizeText(data.mpa_plan),
  network: normalizeText(data.network)
});

const isEditDirty = computed(() => {
  const original = originalEditPayload.value;
  const current = editPayload.value;
  const keys = Object.keys({ ...original, ...current });
  return keys.some((key) => String(original[key]) !== String(current[key]));
});


const mpaDetailsTabs = [
  {
    label: 'Basic Information',
    icon: ['fas', 'book-open'],
    sections: ['Basic Information', 'Location', 'Coordinates', 'Area Information', 'Management & Planning']
  },
  {
    label: 'History',
    icon: ['fas', 'clock-rotate-left'],
    sections: []
  }
];

const mpaDetailsSections: SectionConfig[] = [
  {
    title: 'Basic Information',
    fields: [
      { key: 'complete_name', label: 'Name' },
      { key: 'year_established', label: 'Year Established', type: 'number' },
      { key: 'date_established', label: 'Date Established', type: 'date' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' }
    ]
  },
  {
    title: 'Location',
    fields: [
      { key: 'province', label: 'Province' },
      { key: 'municipality', label: 'Municipality' },
      { key: 'barangay', label: 'Barangay' }
    ]
  },
  {
    title: 'Area Information',
    fields: [
      { key: 'core_area', label: 'Core Area (Ha)', type: 'number' },
      { key: 'buffer_area', label: 'Buffer Area (Ha)', type: 'number' },
      { key: 'total_area', label: 'Total Area (Ha)', type: 'number' }
    ]
  },
  {
    title: 'Coordinates',
    fields: [
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' }
    ]
  },
  {
    title: 'Management & Planning',
    fields: [
      { key: 'mgt_body', label: 'Management Body' },
      { key: 'mpa_plan', label: 'MPA Plan' },
      { key: 'network', label: 'Network' }
    ]
  },
];

const editFieldsWithOptions = computed(() =>
  editFields
    .filter((field) => {
      // Exclude Basic Information fields from editing
      const basicInfoFields = ['complete_name', 'year_established', 'date_established', 'type'];
      return !basicInfoFields.includes(field.key) && field.key !== 'remarks';
    })
    .map((field) => {
      if (field.key === 'province') {
        return {
          ...field,
          props: { options: provinceOptions.value, placeholder: 'Select province' }
        };
      }
      if (field.key === 'municipality') {
        return {
          ...field,
          props: (payload: Record<string, any>) => {
            // Find the province ID from the province name
            const province = provinces.value.find(p => p.name === payload.province);
            const municipalityOpts = useMunicipalityOptions(municipalities, province?.id);
            return {
              options: municipalityOpts.value,
              placeholder: 'Select municipality',
              disabled: !payload.province
            };
          }
        };
      }
      if (field.key === 'barangay') {
        return {
          ...field,
          props: (payload: Record<string, any>) => {
            // Find the municipality ID from the municipality name
            const municipality = municipalities.value.find(m => m.name === payload.municipality);
            const barangayOpts = useBarangayOptions(barangays, municipality?.id);
            return {
              options: barangayOpts.value,
              placeholder: 'Select barangay',
              disabled: !payload.municipality
            };
          }
        };
      }
      return field;
    })
);

window.addEventListener('keydown', onKeyDown);

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

const loadData = async () => {
  const mpaId = route.params.id;
  if (typeof mpaId !== 'string') return;
  try {
    await Promise.all([
      optionsStore.fetchOptions(),
      usersStore.list.length === 0 ? usersStore.fetchAll() : Promise.resolve()
    ]);
    let loaded;
    if (isPending.value) {
      // Pre-populate from cached store data for immediate display (title/fields),
      // but always call loadPendingMPA so ordinances are fetched from the authoritative source
      // (store handles broken queue endpoint via my-mpas fallback)
      const cached = pendingMpaData.value;
      if (cached && String(cached.staging_id) === String(mpaId)) {
        loaded = cached;
      }
      const fresh = await mpaStore.loadPendingMPA(mpaId);
      if (fresh) loaded = fresh;
    } else {
      loaded = await mpaStore.loadMpa(mpaId);
    }
    if (loaded) {
      const payload = buildEditPayload(loaded as Record<string, any>);
      editPayload.value = payload;
      originalEditPayload.value = clonePayload(payload);
    }
    // Fetch ordinance history: for approved MPAs use the API; for pending, read from the store
    if (!isPending.value) {
      try {
        ordinancesLoading.value = true;
        const res = await fetchOrdinances(mpaId);
        ordinances.value = res.data ?? [];
      } catch {
        ordinances.value = [];
      } finally {
        ordinancesLoading.value = false;
      }
    } else {
      // Always read from pendingMpaData (set by navigateToPendingDetails or API fallback)
      // Normalize inline to handle both raw {id,link,name} and already-normalized shapes
      const rawOrds = (pendingMpaData.value as Record<string, unknown>)?.ordinances;
      const ordsArr = Array.isArray(rawOrds) ? rawOrds as Array<Record<string, unknown>> : [];
      ordinances.value = ordsArr
        .filter(o => o.id != null)
        .map(o => ({
          id: o.id as number,
          mpa_id: (o.mpa_id as number) ?? 0,
          year: (o.year as number) ?? 0,
          val: (o.val ?? o.name ?? '') as string,
          type: (o.type as number) ?? 0,
          attach: (o.attach ?? o.link ?? null) as string | null
        }));
    }
  } catch (error) {
    console.error('Error fetching MPA details:', error);
  }
};

onMounted(loadData);

watch(
  () => [route.params.id, route.name] as const,
  ([newId], [oldId]) => {
    if (newId !== oldId) {
      isEditing.value = false;
      ordinances.value = [];
      loadData();
    }
  }
);

const startEdit = () => {
  if (currentData.value) {
    const payload = buildEditPayload(currentData.value);
    editPayload.value = payload;
    originalEditPayload.value = clonePayload(payload);
    isEditing.value = true;
  }
};

const cancelEdit = () => {
  if (currentData.value) {
    const payload = buildEditPayload(currentData.value);
    editPayload.value = payload;
    originalEditPayload.value = clonePayload(payload);
  }
  isEditing.value = false;
};

const requestCancelEdit = () => {
  if (isEditDirty.value) {
    confirmOpen.value = true;
    return;
  }
  cancelEdit();
};

const confirmDiscard = () => {
  confirmOpen.value = false;
  cancelEdit();
  if (pendingRoute.value) {
    const target = pendingRoute.value;
    pendingRoute.value = null;
    router.push(target);
  }
};

const saveEdit = async () => {
  try {
    if (!mpaData.value || isSaving.value) return;
    isSaving.value = true;
    const payload = buildSubmitPayload(editPayload.value);
    await updateMPA(String(mpaData.value.id), payload);
    mpaData.value = { ...mpaData.value, ...payload };
    originalEditPayload.value = clonePayload(buildEditPayload(mpaData.value));
    isEditing.value = false;
  } catch (error) {
    console.error('Error updating MPA:', error);
  } finally {
    isSaving.value = false;
  }
};

onBeforeRouteLeave((to) => {
  if (isEditing.value && isEditDirty.value) {
    pendingRoute.value = to;
    confirmOpen.value = true;
    return false;
  }
  return true;
});
</script>

<style scoped>
.map-link {
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.map-link:hover {
  color: #1e40af;
  text-decoration: underline;
}

.pending-actions {
  position: relative;
}

.pending-actions :deep(.dropdown-button) {
  min-width: 160px;
  border-color: #cbd5e1;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.rejection-reason-field {
  margin-top: 0.5rem;
}

.reason-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.reason-textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #111827;
  resize: vertical;
  min-height: 100px;
}

.reason-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* ── Ordinance history ─────────────────────────────────── */
.ordinance-history {
  width: 100%;
}

.ordinance-loading,
.ordinance-empty {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
}

.ordinance-link {
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.ordinance-link:hover {
  color: #1e40af;
}

.ordinance-download {
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: color 0.15s, background-color 0.15s;
}

.ordinance-download--disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.ordinance-download:hover {
  color: #2563eb;
  background-color: #eff6ff;
}

/* ── File preview modal ────────────────────────────────── */
.file-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.file-preview-card {
  background: #fff;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 900px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.file-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  gap: 1rem;
}

.file-preview-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.file-preview-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.file-preview-download {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  background: #2563eb;
  color: #fff;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-decoration: none;
  transition: background-color 0.15s;
}

.file-preview-download:hover {
  background: #1e40af;
}

.file-preview-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.15s, background-color 0.15s;
}

.file-preview-close:hover {
  color: #111827;
  background: #f3f4f6;
}

.file-preview-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.file-preview-embed,
.file-preview-image {
  width: 100%;
  height: 100%;
  border: none;
  object-fit: contain;
  flex: 1;
}

.file-preview-unsupported {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.95rem;
}
</style>
