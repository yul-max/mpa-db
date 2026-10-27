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
    :show-edit="canEdit"
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
        v-if="currentData && (currentData.id || (currentData.latitude && currentData.longitude))"
        class="map-link"
        @click="showMapModal = true"
        title="Show location on map"
      >
        <FontAwesomeIcon :icon="['fas', 'location-arrow']" /> Show in map
      </span>
    </template>

    <template #tab-history>
      <div class="ordinance-history">
        <div v-if="isAdmin" class="ordinance-header">
          <button
            type="button"
            class="add-ordinance-button"
            :disabled="hasBlankOrdinanceLink"
            :title="hasBlankOrdinanceLink ? 'Fill in the empty link field first' : undefined"
            @click="addOrdinanceRow"
          >
            <FontAwesomeIcon :icon="['fas', 'plus']" />
            Add related document
          </button>
        </div>
        <div v-if="ordinancesLoading" class="ordinance-loading">Loading history...</div>
        <template v-else>
          <DataTable
            :value="isAdmin ? ordinanceForm : ordinances"
            class="ordinance-table"
            striped-rows
          >
            <Column header="Year" style="width: 90px">
              <template #body="{ data: row }">
                <span v-if="row.year == null" class="ordinance-placeholder">&mdash;</span>
                <template v-else>{{ row.year }}</template>
              </template>
            </Column>
            <Column header="Type" style="width: 130px">
              <template #body="{ data: row }">
                <span v-if="row.type == null" class="ordinance-placeholder">&mdash;</span>
                <template v-else>{{ ordinanceTypeLabel(row.type) }}</template>
              </template>
            </Column>
            <Column header="Title">
              <template #body="{ data: row, index }">
                <input
                  v-if="isOrdinanceFormEditable"
                  v-model="ordinanceForm[index]!.name"
                  type="text"
                  class="ordinance-input"
                  placeholder="Document title..."
                  autocomplete="off"
                  :aria-label="`Title for document ${index + 1}`"
                />
                <a
                  v-else-if="ordinanceRowLink(row)"
                  class="ordinance-link ordinance-cell-text"
                  :title="ordinanceRowTitle(row)"
                  @click.prevent="openOrdinancePreview(row)"
                >{{ ordinanceRowTitle(row) }}</a>
                <span v-else class="ordinance-cell-text" :title="ordinanceRowTitle(row)">{{ ordinanceRowTitle(row) }}</span>
              </template>
            </Column>
            <Column v-if="isOrdinanceFormEditable" header="Link">
              <template #body="{ data: row, index }">
                <template v-if="isOrdinanceFormEditable">
                  <input
                    v-model="ordinanceForm[index]!.link"
                    type="url"
                    class="ordinance-input"
                    placeholder="https://drive.google.com/..."
                    autocomplete="off"
                    :aria-label="`Link for document ${index + 1}`"
                  />
                  <p v-if="ordinanceLinkError(ordinanceForm[index]!)" class="ordinance-input-error">
                    Must be a valid Google Drive link.
                  </p>
                </template>
                <span v-else-if="!ordinanceRowLink(row)" class="ordinance-placeholder">&mdash;</span>
                <a
                  v-else
                  class="ordinance-link ordinance-cell-text"
                  :title="ordinanceRowLink(row)"
                  @click.prevent="openOrdinancePreview(row)"
                >{{ ordinanceRowLink(row) }}</a>
              </template>
            </Column>
            <Column v-if="isAdmin" header="" style="width: 56px">
              <template #body="{ index }">
                <button
                  v-if="isOrdinanceFormEditable"
                  type="button"
                  class="ordinance-remove-button"
                  aria-label="Remove document"
                  @click="removeOrdinanceRow(index)"
                >
                  <FontAwesomeIcon :icon="['fas', 'times']" />
                </button>
              </template>
            </Column>
            <!-- Download column hidden until further notice -->
          </DataTable>
          <div v-if="isOrdinanceFormEditable" class="ordinance-form-actions">
            <button
              type="button"
              class="ordinance-cancel-button"
              :disabled="isSubmittingOrdinances"
              @click="resetOrdinanceForm"
            >
              Cancel
            </button>
            <button
              type="button"
              class="add-ordinance-button"
              :disabled="!canSubmitOrdinances"
              @click="submitOrdinanceForm"
            >
              <FontAwesomeIcon :icon="['fas', 'check']" />
              {{ isSubmittingOrdinances ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </template>
        <div
          v-if="!ordinancesLoading && (isAdmin ? ordinanceForm.length === 0 : ordinances.length === 0)"
          class="ordinance-empty"
        >
          No history records found.
        </div>
      </div>
    </template>

    <template #tab-monitoring>
      <div class="meat-scores">
        <div v-if="isAdmin" class="meat-scores-header">
          <button
            type="button"
            class="add-meat-score-button"
            @click="openMEATForm"
          >
            <FontAwesomeIcon :icon="['fas', 'plus']" />
            Add MEAT Score Entry
          </button>
        </div>
        <div v-if="meatScoresLoading" class="ordinance-loading">Loading MEAT scores...</div>
        <DataTable
          v-else
          :value="meatScores"
          sort-field="year"
          :sort-order="-1"
          class="ordinance-table"
          striped-rows
        >
          <Column field="year" header="Year" sortable style="width: 120px" />
          <Column field="level" header="Level" sortable style="width: 150px" />
          <Column field="score" header="Score" sortable />
        </DataTable>
        <div v-if="!meatScoresLoading && meatScores.length === 0" class="ordinance-empty">
          No MEAT scores found.
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
    :open="clearOrdinancesModalOpen"
    title="Remove all related documents?"
    message="You are about to save an empty list, which will remove every related document for this MPA. This cannot be undone."
    confirm-label="Remove all"
    cancel-label="Cancel"
    :loading="isSubmittingOrdinances"
    loading-label="Saving..."
    @confirm="performOrdinanceSubmit"
    @cancel="cancelClearOrdinances"
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
    :loading="isRejecting"
    loading-label="Rejecting..."
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
import { updateMPA, fetchOrdinances, submitOrdinances, approvePendingMPA, rejectPendingMPA, fetchBarangays } from '@/api/mpa';
import { useOptionsStore, type ProvinceApiResponse, type MunicipalityApiResponse, type BarangayApiResponse, type DropdownOption } from '@/stores/options';
import { useProvinceOptions, useMunicipalityOptions } from '@/composables/useDropdownOptions';
import { useUsersStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { ECOSYSTEM_OPTIONS } from '@/constants/ecosystem';

interface FieldConfig {
  key: string;
  label: string;
  fullWidth?: boolean;
  type?: 'text' | 'number' | 'year' | 'boolean' | 'date' | 'tags';
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

interface MEATScore {
  id: number;
  mpa_id: number;
  year: number;
  level: string;
  score: number | string;
}


const route = useRoute();
const router = useRouter();
const mpaStore = useMPAStore();
const { mpaData, pendingMpaData, loading } = storeToRefs(mpaStore);
const optionsStore = useOptionsStore();
const authStore = useAuthStore();
const usersStore = useUsersStore();
const { list: usersList } = storeToRefs(usersStore);

// Detect if this is a pending MPA based on route
const isPending = computed(() => route.meta.pending === true || route.name === 'mpas-pending-details');

// Check if a user is logged in and is an administrator (user_type === 1)
const isAdmin = computed(() => !!authStore.user && authStore.user.user_type === 1);

// Check if user can edit (not pending and not a Viewer)
const canEdit = computed(() => !isPending.value && authStore.user?.user_type !== 3);

// Use the appropriate data source
const currentData = computed(() => isPending.value ? pendingMpaData.value : mpaData.value);

// Get raw options from store
const provinces = computed(() => (optionsStore.options.provinces || []) as ProvinceApiResponse[]);
const municipalities = computed(() => (optionsStore.options.municipalities || []) as MunicipalityApiResponse[]);

// Staging/pending records store municipality as an id; resolve it to a name for display.
// Approved records already store the name, which is returned unchanged.
const municipalityLabel = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const match = municipalities.value.find((m) => String(m.id) === String(value));
  return match ? match.name : String(value);
};

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
const meatScores = ref<MEATScore[]>([]);
const meatScoresLoading = ref(false);
const previewUrl = ref<string | null>(null);
const previewTitle = ref('');
const externalLinkConfirmOpen = ref(false);
const pendingExternalLink = ref<string | null>(null);

const rejectModalOpen = ref(false);
const rejectingStagingId = ref<number | null>(null);
const rejectingMPAName = ref('');
const rejectionReason = ref('');
const isRejecting = ref(false);

const approveModalOpen = ref(false);
const approvingStagingId = ref<number | null>(null);
const approvingMPAName = ref('');

interface OrdinanceEntry {
  id: number | null;
  year: number | null;
  type: number | null;
  name: string;
  link: string;
  // Rows added in this session, as opposed to saved records
  isNew: boolean;
  // Link as it was loaded, used to detect user edits
  originalLink: string;
}
const ordinanceForm = ref<OrdinanceEntry[]>([]);
const originalOrdinanceForm = ref<OrdinanceEntry[]>([]);
const isSubmittingOrdinances = ref(false);

const toast = useToast();

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

const mpaTypeLabel = (type: number | string | Array<number | string> | null | undefined): string => {
  if (type === null || type === undefined || type === '') return 'N/A';

  const toLabel = (part: number | string): string => {
    const num = typeof part === 'string' ? parseInt(part.trim(), 10) : part;
    if (isNaN(num)) {
      // Not a number — return as-is (older records store the label directly)
      return String(part).trim();
    }
    return ECOSYSTEM_OPTIONS.find((o) => o.value === num)?.label ?? 'Unknown';
  };

  // Support multiple types stored as comma-separated values (e.g., "1,3,5")
  const parts = Array.isArray(type) ? type : String(type).split(',');
  return parts
    .map(toLabel)
    .filter((label) => label !== '')
    .join(', ');
};

// Rows come from either the read-only list (Ordinance) or the edit form (OrdinanceEntry)
type OrdinanceRow = Ordinance | OrdinanceEntry;

const ordinanceRowLink = (row: OrdinanceRow): string =>
  (('attach' in row ? row.attach : row.link) ?? '').trim();

const ordinanceRowTitle = (row: OrdinanceRow): string =>
  (('val' in row ? row.val : row.name) ?? '').trim() || ordinanceRowLink(row);

const openOrdinancePreview = (row: OrdinanceRow) => {
  const link = ordinanceRowLink(row);
  if (!link) return;

  // Only mandaragat links are opened inline. External links require confirmation.
  if (!isMandaragatLink(link)) {
    pendingExternalLink.value = link;
    externalLinkConfirmOpen.value = true;
    return;
  }

  previewTitle.value = ordinanceRowTitle(row);
  previewUrl.value = link;
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

const openMEATForm = () => {
  window.open('https://docs.google.com/forms/d/e/1FAIpQLScoV5fvHaPjUtazeakqvx771Amk5FyKI1CcdqZXrT6AnD7zAw/viewform', '_blank', 'noopener,noreferrer');
};

// The history table doubles as the edit form: existing records are editable and
// removable, and new rows can be appended. Submitting sends the full list.
const toOrdinanceEntry = (o: Ordinance): OrdinanceEntry => ({
  id: o.id ?? null,
  year: o.year ?? null,
  type: o.type ?? null,
  name: o.val ?? '',
  link: o.attach ?? '',
  isNew: false,
  originalLink: o.attach ?? ''
});

const syncOrdinanceForm = () => {
  ordinanceForm.value = ordinances.value.map(toOrdinanceEntry);
  originalOrdinanceForm.value = ordinances.value.map(toOrdinanceEntry);
};

const addOrdinanceRow = () => {
  ordinanceForm.value.push({
    id: null,
    year: null,
    type: null,
    name: '',
    link: '',
    isNew: true,
    originalLink: ''
  });
};

const removeOrdinanceRow = (index: number) => {
  ordinanceForm.value.splice(index, 1);
};

const resetOrdinanceForm = () => {
  ordinanceForm.value = originalOrdinanceForm.value.map((entry) => ({ ...entry }));
};

const isGoogleDriveLink = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return parsed.hostname === 'drive.google.com' || parsed.hostname === 'docs.google.com';
  } catch {
    return false;
  }
};

// Existing records may hold legacy (non-Drive) links; only enforce the Drive
// requirement on links the user actually entered or changed.
const isOrdinanceLinkUnchanged = (entry: OrdinanceEntry) =>
  !entry.isNew && entry.link === entry.originalLink;

// New rows must carry a valid Drive link. Existing records may legitimately
// have no attachment or hold a legacy (non-Drive) link, so only enforce the
// Drive requirement on links the user actually changed.
const isOrdinanceEntryValid = (entry: OrdinanceEntry) => {
  const link = entry.link.trim();
  if (!entry.isNew) {
    return link === '' || isOrdinanceLinkUnchanged(entry) || isGoogleDriveLink(link);
  }
  return link !== '' && isGoogleDriveLink(link);
};

// Only newly added rows must have a link before another row can be added;
// existing records may legitimately have no attachment
const hasBlankOrdinanceLink = computed(() =>
  ordinanceForm.value.some((entry) => entry.isNew && entry.link.trim() === '')
);

// The table doubles as the edit form: rows become editable in edit mode, or as
// soon as a new row is added. The Link column only exists for editing, so it is
// shown under the same condition.
const isOrdinanceFormEditable = computed(() =>
  isAdmin.value &&
  (isEditing.value || ordinanceForm.value.some((entry) => entry.isNew))
);

const ordinanceLinkError = (entry: OrdinanceEntry) =>
  entry.link.trim() !== '' && !isOrdinanceLinkUnchanged(entry) && !isGoogleDriveLink(entry.link.trim());

// A freshly added row the user has not filled in yet is ignored: it neither
// blocks saving other changes nor gets submitted
const isOrdinanceEntryBlank = (entry: OrdinanceEntry) =>
  entry.isNew && entry.name.trim() === '' && entry.link.trim() === '';

const submittableOrdinanceEntries = computed(() =>
  ordinanceForm.value.filter((entry) => !isOrdinanceEntryBlank(entry))
);

const isOrdinanceFormDirty = computed(() =>
  JSON.stringify(submittableOrdinanceEntries.value) !== JSON.stringify(originalOrdinanceForm.value)
);

const canSubmitOrdinances = computed(() =>
  !isSubmittingOrdinances.value &&
  isOrdinanceFormDirty.value &&
  submittableOrdinanceEntries.value.every(isOrdinanceEntryValid)
);

const clearOrdinancesModalOpen = ref(false);

const performOrdinanceSubmit = async () => {
  const record = currentData.value;
  const mpaId = (isPending.value ? record?.staging_id : record?.id) ?? route.params.id;

  const payload = submittableOrdinanceEntries.value.map((entry) => ({
    ordinance_name: entry.name.trim(),
    ordinance_link: entry.link.trim()
  }));

  isSubmittingOrdinances.value = true;
  try {
    await submitOrdinances(String(mpaId), payload);
    toast.success('Related documents saved successfully.');
    // Reload the full MPA record (details + history) so the view reflects the saved state
    await loadData();
    clearOrdinancesModalOpen.value = false;
  } catch (error: any) {
    console.error('Error saving related documents:', error);
    toast.error(error.response?.data?.error || 'Failed to save related documents.');
  } finally {
    isSubmittingOrdinances.value = false;
  }
};

const submitOrdinanceForm = async () => {
  if (!canSubmitOrdinances.value) return;

  // Submitting an empty list wipes every existing related document — confirm first
  if (submittableOrdinanceEntries.value.length === 0) {
    clearOrdinancesModalOpen.value = true;
    return;
  }

  await performOrdinanceSubmit();
};

const cancelClearOrdinances = () => {
  if (isSubmittingOrdinances.value) return;
  clearOrdinancesModalOpen.value = false;
  resetOrdinanceForm();
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

const isRejected = computed(() => {
  const data = currentData.value as Record<string, unknown> | null;
  const status = String(data?.upload_status ?? data?.status ?? '').toLowerCase();
  return status === 'rejected';
});

// Staging records can be pending, rejected, or approved — reflect the real status
const pendingStatusLabel = computed(() => {
  const data = currentData.value as Record<string, unknown> | null;
  const status = String(data?.upload_status ?? data?.status ?? '').toLowerCase();
  switch (status) {
    case 'rejected':
      return 'Rejected';
    case 'approved':
      return 'Approved';
    case '':
    case 'pending':
      return 'Pending Approval';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
});

const pendingActionItems = computed<DropdownItem[]>(() => {
  const items: DropdownItem[] = [
    {
      icon: 'pen-to-square',
      title: 'Edit',
      handler: handlePendingEdit
    },
    {
      icon: 'check',
      title: 'Approve',
      handler: handlePendingApprove
    }
  ];

  if (!isRejected.value) {
    items.push({
      icon: 'x',
      title: 'Reject',
      handler: handlePendingReject
    });
  }

  return items;
});

const confirmApprove = async () => {
  if (!approvingStagingId.value) return;

  approveModalOpen.value = false;
  try {
    const response = await approvePendingMPA(approvingStagingId.value);
    if (response.data.success) {
      toast.success(`MPA approved successfully! New MPA ID: ${response.data.new_mpa_id}`, { title: 'MPA Approved' });
      await router.push({ name: 'mpas-list' });
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || 'Failed to approve MPA';
    toast.error(errorMsg, { title: 'Approval Failed' });
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
  if (!rejectionReason.value.trim() || !rejectingStagingId.value || isRejecting.value) return;

  isRejecting.value = true;
  try {
    const response = await rejectPendingMPA(rejectingStagingId.value, rejectionReason.value.trim());
    if (response.data.success) {
      rejectModalOpen.value = false;
      rejectingStagingId.value = null;
      rejectingMPAName.value = '';
      rejectionReason.value = '';

      toast.success('MPA rejected successfully. The uploader will be notified via email.', { title: 'MPA Rejected' });
      await router.push({ name: 'mpas-list' });
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || 'Failed to reject MPA';
    toast.error(errorMsg, { title: 'Rejection Failed' });
  } finally {
    isRejecting.value = false;
  }
};

const cancelReject = () => {
  if (isRejecting.value) return;
  rejectModalOpen.value = false;
  rejectingStagingId.value = null;
  rejectingMPAName.value = '';
  rejectionReason.value = '';
};

const detailsTitle = computed(() => {
  const source = isEditing.value ? editPayload.value : currentData.value;
  // id/staging_id are not part of the edit payload, so always read them from the loaded record
  const record = currentData.value;
  if (!source || !record) return isPending.value ? 'Pending MPA Details' : 'MPA Details';

  const mpaId = isPending.value ? (record.staging_id || 'N/A') : (record.id || 'N/A');
  const mpaName = source?.complete_name || record.complete_name || '';

  return mpaName ? `MPA-${mpaId} ${mpaName}` : (isPending.value ? 'Pending MPA Details' : 'MPA Details');
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
  // Audit metadata is not part of the edit payload, so always read it from the loaded record
  const record = currentData.value;
  if (!source || !record) return '';

  const locationParts: string[] = [];
  if (source.barangay) locationParts.push(`Brgy. ${source.barangay}`);
  if (source.municipality) locationParts.push(municipalityLabel(source.municipality));
  if (source.province) locationParts.push(source.province);

  const subtitle = locationParts.length > 0
    ? locationParts.join(', ')
    : 'Location not available';

  // Touch usersList to make this computed reactive to user store changes
  void usersList.value;

  if (isPending.value) {
    const uploadedByName = usersStore.getUserFullName(record.uploaded_by as string | number | null | undefined);
    return `${subtitle}\nStatus: ${pendingStatusLabel.value}\nUploaded by: ${uploadedByName}`;
  }

  const uploadedByName = usersStore.getUserFullName(record.uploaded_by as string | number | null | undefined);
  const approvedByName = usersStore.getUserFullName(record.approved_by as string | number | null | undefined);
  const approvedAt = formatDate(record.approved_at as string | null | undefined);
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
    sections: ['Basic Information', 'Location', 'Coordinates', 'Area Information']
  },
  {
    label: 'History',
    icon: ['fas', 'clock-rotate-left'],
    sections: []
  },
  {
    label: 'Management',
    icon: ['fas', 'users'],
    sections: ['Management & Planning']
  },
  {
    label: 'Monitoring',
    icon: ['fas', 'chart-line'],
    sections: []
  }
];

const mpaDetailsSections: SectionConfig[] = [
  {
    title: 'Basic Information',
    fields: [
      { key: 'complete_name', label: 'Name' },
      { key: 'year_established', label: 'Year Established', type: 'year' },
      { key: 'date_established', label: 'Date Established', type: 'date' },
      { key: 'type', label: 'Type', type: 'tags', formatter: mpaTypeLabel },
      { key: 'status', label: 'Status' }
    ]
  },
  {
    title: 'Location',
    fields: [
      { key: 'province', label: 'Province' },
      { key: 'municipality', label: 'Municipality', formatter: municipalityLabel },
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
  }
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
          props: (payload: Record<string, any>) => ({
            options: barangayOptions.value,
            placeholder: 'Select barangay',
            disabled: !payload.municipality
          })
        };
      }
      return field;
    })
);

// Barangay options are fetched from the /barangays endpoint per selected municipality.
// payload.municipality may hold a name (loaded record) or an id (user selection).
const barangayOptions = ref<DropdownOption[]>([]);

const resolveMunicipalityId = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const municipality =
    municipalities.value.find((m) => m.name === value) ??
    municipalities.value.find((m) => String(m.id) === String(value));
  return municipality?.id;
};

watch(
  () => editPayload.value.municipality,
  async (municipality, previousMunicipality) => {
    // Clear a stale barangay selection when the municipality changes mid-edit
    if (previousMunicipality !== undefined && previousMunicipality !== '' && municipality !== previousMunicipality) {
      editPayload.value.barangay = '';
    }

    const municipalityId = resolveMunicipalityId(municipality);
    if (municipalityId === undefined) {
      barangayOptions.value = [];
      return;
    }

    try {
      const { data } = await fetchBarangays(municipalityId);
      // Ignore stale responses from earlier selections
      if (editPayload.value.municipality !== municipality) return;

      const items = (Array.isArray(data) ? data : []) as BarangayApiResponse[];
      barangayOptions.value = items
        .filter((item) => item.name != null && item.name !== '')
        .map((item) => ({ label: item.name, value: String(item.id) }))
        .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      console.error('Failed to fetch barangays:', error);
      barangayOptions.value = [];
    }
  }
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
    syncOrdinanceForm();
    // TODO: Fetch MEAT scores from API when available
    meatScoresLoading.value = false;
    meatScores.value = [];
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
      ordinanceForm.value = [];
      originalOrdinanceForm.value = [];
      meatScores.value = [];
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
  resetOrdinanceForm();
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
    const record = currentData.value;
    if (!record || isSaving.value) return;
    isSaving.value = true;
    const payload = buildSubmitPayload(editPayload.value);
    const targetId = isPending.value ? record.staging_id : record.id;
    await updateMPA(String(targetId ?? route.params.id), payload);
    if (isPending.value) {
      pendingMpaData.value = { ...record, ...payload };
      originalEditPayload.value = clonePayload(buildEditPayload(pendingMpaData.value));
    } else {
      mpaData.value = { ...record, ...payload };
      originalEditPayload.value = clonePayload(buildEditPayload(mpaData.value));
    }
    isEditing.value = false;
    toast.success('MPA updated successfully.');
  } catch (error: any) {
    console.error('Error updating MPA:', error);
    toast.error(error.response?.data?.error || 'Failed to update MPA.');
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

/* ── Inline related document form (History table) ─────── */
.ordinance-table {
  width: 100%;
  max-width: 100%;
}

/* Fixed layout keeps long titles/links from widening the table */
.ordinance-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.ordinance-table :deep(td) {
  vertical-align: middle;
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
}

.ordinance-cell-text {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ordinance-placeholder {
  color: #9ca3af;
}

.ordinance-remove-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: color 0.15s, background-color 0.15s;
}

.ordinance-remove-button:hover {
  color: #dc2626;
  background: #fef2f2;
}

.ordinance-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.ordinance-cancel-button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ordinance-cancel-button:hover {
  background: #f3f4f6;
}

.ordinance-cancel-button:disabled,
.add-ordinance-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ordinance-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.625rem;
  font-size: 0.875rem;
  color: #111827;
  background: #fff;
}

.ordinance-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.ordinance-input-error {
  margin: 0.375rem 0 0;
  font-size: 0.8125rem;
  color: #dc2626;
}

/* ── Ordinance history ─────────────────────────────────── */
.ordinance-history {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.ordinance-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.add-ordinance-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-ordinance-button:hover {
  background-color: #2563eb;
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

/* ── MEAT Scores ──────────────────────────────────────── */
.meat-scores {
  width: 100%;
}

.meat-scores-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.add-meat-score-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-meat-score-button:hover {
  background-color: #2563eb;
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
