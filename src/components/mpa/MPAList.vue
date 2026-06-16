<template>
  <GenericDataTable
    ref="dataTableRef"
    :rows="mpas"
    :columns="tableColumns"
    :totalRecords="totalRecords"
    :loading="loading"
    :pageSize="rows"
    :sortField="sortField || undefined"
    :sortOrder="dataTableSortOrder"
    exportListName="MPA"
    :exportAllRows="fetchAllMPAsForExport"
    :rowContextMenuActions="showPendingMPAs ? pendingRowContextMenu : undefined"
    @page="onPageChange"
    @sort="handleSort"
    @filter-change="handleFilterChange"
    @row-click="handleRowClick"
    @create="openCreateForm"
  >
    <template #header>
      <div class="header-container">
        <h1 class="text-2xl font-bold">
          {{ showMyMPAs ? 'My MPAs' : showPendingMPAs ? 'Pending MPAs' : 'MPA Records' }}
        </h1>
        <div v-if="isAdmin || canViewMyMPAs" class="view-toggle">
          <button
            :class="['toggle-btn', { active: !showPendingMPAs && !showMyMPAs }]"
            @click="setActiveView('approved')"
          >
            Approved MPAs
          </button>
          <button
            v-if="canViewMyMPAs"
            :class="['toggle-btn', { active: showMyMPAs }]"
            @click="setActiveView('my-mpas')"
          >
            My MPAs
          </button>
          <button
            v-if="isAdmin"
            :class="['toggle-btn', { active: showPendingMPAs }]"
            @click="setActiveView('pending')"
          >
            Pending Approval
          </button>
        </div>
      </div>
    </template>
  </GenericDataTable>

  <AddMPAForm
    ref="addMPAFormRef"
    @submit="handleCreateMPA"
  />

  <!-- Approve Confirmation Modal -->
  <ConfirmModal
    :open="approveModalOpen"
    :title="`Approve MPA: ${approvingMPAName}`"
    message="Are you sure you want to approve this MPA? This will publish it to the main database."
    confirm-label="Approve MPA"
    cancel-label="Cancel"
    @confirm="confirmApprove"
    @cancel="cancelApprove"
  />

  <!-- Reject Modal with Reason -->
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

  <!-- Success/Error Message Modal -->
  <ConfirmModal
    :open="messageModalOpen"
    :title="messageModalTitle"
    :message="messageModalContent"
    :confirm-label="'OK'"
    :cancel-label="''"
    @confirm="messageModalOpen = false"
    @cancel="messageModalOpen = false"
  />

  <!-- View Rejection Reason Modal -->
  <ConfirmModal
    :open="viewRejectionReasonModalOpen"
    :title="`Rejection Reason: ${viewingMPAName}`"
    :message="viewingRejectionReason"
    :confirm-label="'Close'"
    :cancel-label="''"
    @confirm="viewRejectionReasonModalOpen = false"
    @cancel="viewRejectionReasonModalOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, h } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { ColumnDef } from '@/types/ui';
import { fetchMPADatalist, approvePendingMPA, rejectPendingMPA, fetchMyMPAs } from '@/api/mpa';
import GenericDataTable from '@/components/ui/GenericDataTable.vue';
import AddMPAForm from './AddMPAForm.vue';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';
import { useOptionsStore, type ProvinceApiResponse, type MunicipalityApiResponse } from '@/stores/options';
import { useProvinceOptions } from '@/composables/useDropdownOptions';
import { useAuthStore } from '@/stores/auth';
import { useMPAStore } from '@/stores/mpa';

const router = useRouter();
const optionsStore = useOptionsStore();
const authStore = useAuthStore();
const mpaStore = useMPAStore();
const { options } = storeToRefs(optionsStore);
const { pendingMPAs } = storeToRefs(mpaStore);

// Check if user is admin (user_type === 1)
const isAdmin = computed(() => authStore.user?.user_type === 1);

// Check if user can see My MPAs tab (user_type === 1 or 2)
const canViewMyMPAs = computed(() => {
  const userType = authStore.user?.user_type;
  return userType === 1 || userType === 2;
});

// Toggle between regular MPAs, pending MPAs, and My MPAs
const showPendingMPAs = ref(false);
const showMyMPAs = ref(false);

// Transform raw options into dropdown format
const provinces = computed(() => (options.value.provinces || []) as ProvinceApiResponse[]);
const municipalities = computed(() => (options.value.municipalities || []) as MunicipalityApiResponse[]);
const provinceOptions = useProvinceOptions(provinces);

const mpas = ref<any[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const rows = ref(10);
const totalRecords = ref(0);
const addMPAFormRef = ref<InstanceType<typeof AddMPAForm> | null>(null);
const dataTableRef = ref<InstanceType<typeof GenericDataTable> | null>(null);

const sortField = ref<string | null>(null);
const sortOrder = ref<'asc' | 'desc'>('asc');
const searchQuery = ref('');
const filterQuery = ref('');
const selectedProvinces = ref<string[]>([]);

// Rejection modal state
const rejectModalOpen = ref(false);
const rejectingStagingId = ref<number | null>(null);
const rejectingMPAName = ref('');
const rejectionReason = ref('');
const isProcessing = ref(false);

// Approval confirmation modal state
const approveModalOpen = ref(false);
const approvingStagingId = ref<number | null>(null);
const approvingMPAName = ref('');

// Success/error message modal state
const messageModalOpen = ref(false);
const messageModalTitle = ref('');
const messageModalContent = ref('');
const messageModalType = ref<'success' | 'error'>('success');

// Rejection reason view modal state
const viewRejectionReasonModalOpen = ref(false);
const viewingRejectionReason = ref('');
const viewingMPAName = ref('');

// Ecosystem type mapping (1-10)
const ecosystemTypes: Record<number, string> = {
  1: 'Corals',
  2: 'Mangrove',
  3: 'Seagrass',
  4: 'Wetlands',
  5: 'Sandy Beach',
  6: 'Mudflat',
  7: 'Rocky Shore',
  8: 'Freshwater',
  9: 'Fish Sanctuary',
  10: 'Seaweeds'
};

const dataTableSortOrder = computed(() => (sortOrder.value === 'asc' ? 1 : -1));

// Municipality options filtered by selected provinces
const municipalityOptions = computed(() => {
  if (selectedProvinces.value.length === 0) {
    // No province filter: return all municipalities as options
    return municipalities.value
      .filter((item) => item.name != null && item.name !== '')
      .map((item) => ({
        label: item.name,
        value: item.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Get province IDs for selected province names
  const selectedProvinceIds = provinces.value
    .filter((p) => selectedProvinces.value.includes(p.name))
    .map((p) => p.id);

  // Create a map of province_id to province_name for quick lookup
  const provinceMap = new Map(provinces.value.map((p) => [p.id, p.name]));

  // Show province in label only when multiple provinces are selected
  const showProvince = selectedProvinces.value.length > 1;

  // Filter municipalities by selected province IDs and include province in label if needed
  return municipalities.value
    .filter((item) =>
      item.name != null &&
      item.name !== '' &&
      item.province_id != null &&
      selectedProvinceIds.includes(item.province_id)
    )
    .map((item) => {
      // Look up province name from the map
      const provinceName = item.province_name ||
        (item.province_id ? provinceMap.get(item.province_id) : undefined);

      return {
        label: showProvince && provinceName
          ? `${item.name} (${provinceName})`
          : item.name,
        value: item.name
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
});

const approvedTableColumns = ref<ColumnDef[]>([
  { field: 'id', header: 'ID', show: true, colWidth: 80, type: 'number', sort_column: 'id', sortable: true },
  {
    field: 'complete_name',
    header: 'Name',
    show: true,
    colWidth: 400,
    type: 'string',
    sort_column: 'complete_name',
    sortable: true,
    filter: 'InputText',
    render: (row) => h('button', {
      class: 'table-link-button',
      onClick: () => navigateToDetails(row.id as string | number)
    }, row.complete_name as string)
  },
  {
    field: 'province',
    header: 'Province',
    show: false,
    colWidth: 200,
    type: 'string',
    sort_column: 'province',
    sortable: false,
    filter: 'MultiSelect',
    source: { data: [] }
  },
  {
    field: 'municipality',
    header: 'Municipality',
    show: false,
    colWidth: 200,
    type: 'string',
    sort_column: 'municipality',
    sortable: false,
    filter: 'MultiSelect',
    source: { data: [] }
  },
  {
    field: 'location',
    header: 'Full Location',
    show: true,
    colWidth: 300,
    type: 'string',
    sort_column: 'province',
    sortable: false,
    exportValue: (row) => formatLocation(row as Record<string, any>),
    render: (row) => formatLocation(row as Record<string, any>)
  },
  { field: 'year_established', header: 'Year Established', show: true, type: 'number', sort_column: 'year_established', sortable: true },
  { field: 'total_area', header: 'Total Area (Ha)', show: true, type: 'number', sort_column: 'total_area', sortable: true, exportValue: (row) => formatNumber(row.total_area as number), render: (row) => formatNumber(row.total_area as number) },
  { field: 'core_area', header: 'Core Area (Ha)', show: true, type: 'number', sort_column: 'core_area', sortable: true, exportValue: (row) => formatNumber(row.core_area as number), render: (row) => formatNumber(row.core_area as number) },
  { field: 'buffer_area', header: 'Buffer Area (Ha)', show: true, type: 'number', sort_column: 'buffer_area', sortable: true, exportValue: (row) => formatNumber(row.buffer_area as number), render: (row) => formatNumber(row.buffer_area as number) },
  { field: 'is_validated', header: 'Validated', show: true, type: 'boolean', sort_column: 'is_validated', sortable: true, filter: 'SwitchField' },
  { field: 'is_nipas', header: 'NIPAS', show: true, type: 'boolean', sort_column: 'is_nipas', sortable: true, filter: 'SwitchField' }
]);

const pendingTableColumns = ref<ColumnDef[]>([
  {
    field: 'staging_id',
    header: 'ID',
    show: true,
    colWidth: 100,
    type: 'number',
    sort_column: 'staging_id',
    sortable: true
  },
  {
    field: 'complete_name',
    header: 'Name',
    show: true,
    colWidth: 300,
    type: 'string',
    sort_column: 'complete_name',
    sortable: true,
    filter: 'InputText',
    render: (row) => h('button', {
      class: 'table-link-button',
      onClick: () => navigateToPendingDetails(row.staging_id as string | number, row as Record<string, unknown>)
    }, row.complete_name as string)
  },
  {
    field: 'type',
    header: 'Ecosystem Type',
    show: true,
    colWidth: 150,
    type: 'string',
    sort_column: 'type',
    sortable: true,
    exportValue: (row) => ecosystemTypes[row.type as number] || 'Unknown',
    render: (row) => ecosystemTypes[row.type as number] || 'Unknown'
  },
  {
    field: 'year_established',
    header: 'Year Established',
    show: true,
    colWidth: 150,
    type: 'number',
    sort_column: 'year_established',
    sortable: true
  },
  {
    field: 'date_established',
    header: 'Date Established',
    show: true,
    colWidth: 150,
    type: 'string',
    sort_column: 'date_established',
    sortable: true
  },
  {
    field: 'area_ha',
    header: 'Area (Ha)',
    show: true,
    colWidth: 150,
    type: 'number',
    sort_column: 'area_ha',
    sortable: true,
    exportValue: (row) => formatNumber(row.area_ha as number),
    render: (row) => formatNumber(row.area_ha as number)
  },
  {
    field: 'is_nipas',
    header: 'NIPAS',
    show: true,
    colWidth: 100,
    type: 'boolean',
    sort_column: 'is_nipas',
    sortable: true
  }
]);

const myMPAsTableColumns = ref<ColumnDef[]>([
  {
    field: 'complete_name',
    header: 'Name',
    show: true,
    colWidth: 300,
    type: 'string',
    sort_column: 'complete_name',
    sortable: true,
    filter: 'InputText',
    render: (row) => h('button', {
      class: 'table-link-button',
      onClick: (event: MouseEvent) => {
        event.stopPropagation();
        // Navigate based on upload status
        const status = (row._uploadStatus as string || '').toLowerCase();
        if ((status === 'pending' || status === 'rejected') && row.staging_id) {
          navigateToPendingDetails(row.staging_id, row as Record<string, unknown>);
        } else if (row.id) {
          navigateToDetails(row.id);
        }
      }
    }, row.complete_name as string)
  },
  {
    field: '_uploadStatus',
    header: 'Status',
    show: true,
    colWidth: 150,
    type: 'string',
    sortable: true,
    exportValue: (row) => {
      const status = (row._uploadStatus as string || 'pending').toLowerCase();
      if (status === 'approved') return 'Approved';
      if (status === 'rejected') return 'Rejected';
      return 'Pending';
    },
    render: (row) => {
      const status = (row._uploadStatus as string || 'pending').toLowerCase();
      let className = 'status-badge ';
      let label = '';

      if (status === 'approved') {
        className += 'status-approved';
        label = 'Approved';
        return h('span', { class: className }, label);
      } else if (status === 'rejected') {
        className += 'status-rejected';
        label = 'Rejected';
        // Create container with badge and info icon
        return h('div', { class: 'status-container' }, [
          h('span', { class: className }, label),
          h('button', {
            class: 'rejection-info-icon',
            title: 'View rejection reason',
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              viewingMPAName.value = row.complete_name || 'Unknown MPA';
              viewingRejectionReason.value = row.rejection_reason || 'No reason provided';
              viewRejectionReasonModalOpen.value = true;
            }
          }, 'ⓘ')
        ]);
      } else {
        className += 'status-pending';
        label = 'Pending';
        return h('span', { class: className }, label);
      }
    }
  },
  {
    field: 'location',
    header: 'Location',
    show: true,
    colWidth: 250,
    type: 'string',
    sortable: false,
    exportValue: (row) => formatLocation(row as Record<string, any>),
    render: (row) => formatLocation(row as Record<string, any>)
  },
  { field: 'year_established', header: 'Year Established', show: true, type: 'number', sort_column: 'year_established', sortable: true },
  { field: 'total_area', header: 'Total Area (Ha)', show: true, type: 'number', sort_column: 'total_area', sortable: true, exportValue: (row) => formatNumber(row.total_area as number), render: (row) => formatNumber(row.total_area as number) },
  { field: 'is_validated', header: 'Validated', show: true, type: 'boolean', sort_column: 'is_validated', sortable: true },
  { field: 'is_nipas', header: 'NIPAS', show: true, type: 'boolean', sort_column: 'is_nipas', sortable: true }
]);

// Use computed to switch between column sets
const tableColumns = computed(() => {
  if (showMyMPAs.value) return myMPAsTableColumns.value;
  if (showPendingMPAs.value) return pendingTableColumns.value;
  return approvedTableColumns.value;
});

// Set province options when they're loaded
watch(provinceOptions, (next) => {
  const provinceColumn = approvedTableColumns.value.find((col) => col.field === 'province');
  if (!provinceColumn) return;
  // Create new source object to trigger reactivity
  provinceColumn.source = { data: next };
  // Force table columns update to trigger re-render
  approvedTableColumns.value = [...approvedTableColumns.value];
}, { immediate: true });

// Set municipality options dynamically based on selected provinces
watch(municipalityOptions, (next) => {
  const municipalityColumn = approvedTableColumns.value.find((col) => col.field === 'municipality');
  if (!municipalityColumn) return;
  // Create new source object to trigger reactivity
  municipalityColumn.source = { data: next };
  // Force table columns update to trigger re-render
  approvedTableColumns.value = [...approvedTableColumns.value];
}, { immediate: true });

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatLocation = (data: Record<string, any>) => {
  const parts: string[] = [];
  if (data.barangay) parts.push(`Brgy. ${data.barangay}`);
  if (data.municipality) parts.push(data.municipality);
  if (data.province) parts.push(data.province);
  return parts.join(', ') || 'Not specified';
};

const onPageChange = (event: any) => {
  currentPage.value = Math.floor(event.first / event.rows) + 1;
  rows.value = event.rows;
  fetchData();
};

const handleSort = (event: { sortField?: string; sortOrder?: number }) => {
  if (!event.sortField) return;
  const columns = showPendingMPAs.value ? pendingTableColumns.value : approvedTableColumns.value;
  const column = columns.find((col) => col.field === event.sortField);
  if (!column?.sortable) return;
  sortField.value = column.sort_column || column.field;
  sortOrder.value = event.sortOrder === -1 ? 'desc' : 'asc';
  fetchData();
};

const handleFilterChange = (filters: Record<string, unknown>) => {
  // Skip complex filter logic for pending MPAs and My MPAs (they don't support server-side filtering yet)
  if (showPendingMPAs.value || showMyMPAs.value) {
    // For pending/my MPAs, just handle simple search
    const nextQuery = typeof filters.complete_name === 'string' ? filters.complete_name : '';
    searchQuery.value = nextQuery;
    // Client-side filtering would happen here if needed
    return;
  }

  // Handle search query (complete_name filter)
  const nextQuery = typeof filters.complete_name === 'string' ? filters.complete_name : '';
  searchQuery.value = nextQuery;

  // Track selected provinces for municipality cascading
  const newSelectedProvinces = Array.isArray(filters.province)
    ? filters.province.map(String)
    : [];

  // If provinces changed and there are municipality filters, clean them up
  if (Array.isArray(filters.municipality) && filters.municipality.length > 0) {
    // Get province IDs for newly selected provinces
    const selectedProvinceIds = provinces.value
      .filter((p) => newSelectedProvinces.includes(p.name))
      .map((p) => p.id);

    // Get valid municipality names (those belonging to selected provinces)
    const validMunicipalityNames = municipalities.value
      .filter((m) =>
        m.province_id != null &&
        selectedProvinceIds.includes(m.province_id)
      )
      .map((m) => m.name);

    // Filter out municipalities that don't belong to selected provinces
    const cleanedMunicipalities = filters.municipality.filter((muni) =>
      validMunicipalityNames.includes(String(muni))
    );

    // If municipalities were removed, update the filter in the data table
    if (cleanedMunicipalities.length !== filters.municipality.length) {
      filters.municipality = cleanedMunicipalities;
      // Update the data table's filter values
      if (dataTableRef.value?.filterValues) {
        dataTableRef.value.filterValues.municipality = cleanedMunicipalities;
      }
    }
  }

  selectedProvinces.value = newSelectedProvinces;

  // Build filter query for non-search filters
  const entries = Object.entries(filters).filter(([key, value]) => {
    if (key === 'complete_name') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  });

  if (entries.length === 0) {
    filterQuery.value = '';
    fetchData();
    return;
  }

  // Build filter query from all active filters
  const filterParts: string[] = [];

  // Track which provinces have municipality filters
  const provincesWithMunicipalities = new Set<string>();

  // First pass: identify provinces that have municipality filters
  if (Array.isArray(filters.municipality) && filters.municipality.length > 0) {
    filters.municipality.forEach((muniName) => {
      const muni = municipalities.value.find((m) => m.name === muniName);
      if (muni?.province_id) {
        const province = provinces.value.find((p) => p.id === muni.province_id);
        if (province) {
          provincesWithMunicipalities.add(province.name);
        }
      }
    });
  }

  for (const [field, value] of entries) {
    const column = approvedTableColumns.value.find((col) => col.field === field);
    const filterColumn = column?.sort_column || field;
    const filterValues = Array.isArray(value)
      ? value.map(String)
      : [String(value)];
    const isBooleanColumn = column?.type === 'boolean' || typeof value === 'boolean';

    if (isBooleanColumn) {
      filterParts.push(`${filterColumn}=${filterValues.join(',')}`);
    } else if (field === 'province') {
      // Format: province:Province1,Province2
      const provinceParts: string[] = [];

      filterValues.forEach((provinceName) => {
        // Only add standalone province if it doesn't have municipality filters
        if (!provincesWithMunicipalities.has(provinceName)) {
          provinceParts.push(`${filterColumn}:${provinceName}`);
        }
      });

      if (provinceParts.length > 0) {
        filterParts.push(provinceParts.join(','));
      }
    } else if (field === 'municipality') {
      // Format: Province1:Municipality1,Province2:Municipality2
      const municipalityParts: string[] = [];

      filterValues.forEach((muniName) => {
        const muni = municipalities.value.find((m) => m.name === muniName);
        if (muni?.province_id) {
          const province = provinces.value.find((p) => p.id === muni.province_id);
          if (province) {
            municipalityParts.push(`${province.name}:${muniName}`);
          }
        }
      });

      if (municipalityParts.length > 0) {
        filterParts.push(municipalityParts.join(','));
      }
    } else if (filterValues.length > 1) {
      filterParts.push(
        filterValues.map((item) => `${filterColumn}:${item}`).join(',')
      );
    } else {
      filterParts.push(`${filterColumn}:${filterValues[0]}`);
    }
  }

  filterQuery.value = filterParts.join(',');
  fetchData();
};

// Transform pending MPA data from nested structure to flat structure
const transformPendingMPA = (item: any) => {
  // Check if data is in nested GeoJSON format or already flat
  const feature = item.features?.[0];
  const props = feature?.properties || {};

  // If features exist, use nested structure; otherwise, assume flat structure
  const isNested = !!item.features;
  const dataSource = isNested ? props : item;

  return {
    staging_id: item.staging_id ?? item.id,
    feature_count: item.feature_count,
    complete_name: dataSource.complete_name || 'N/A',
    type: dataSource.type,
    year_established: dataSource.year_established || null,
    date_established: dataSource.date_established || null,
    area_ha: dataSource.Area_ha || dataSource.Hectares || dataSource.area_ha || dataSource.total_area || 0,
    is_nipas: dataSource.is_nipas || 0,
    zone_id: dataSource.zone_id,
    province: dataSource.province,
    municipality: dataSource.municipality,
    barangay: dataSource.barangay,
    total_area: dataSource.total_area || dataSource.Area_ha || dataSource.Hectares || 0,
    core_area: dataSource.core_area,
    buffer_area: dataSource.buffer_area,
    is_validated: dataSource.is_validated || 0,
    rejection_reason: item.rejection_reason || null,
    // Keep original data for potential detail view
    _raw: item
  };
};

const fetchData = async () => {
  loading.value = true;
  try {
    if (showMyMPAs.value) {
      // Fetch user's own MPAs - returns {success, staging, approved}
      const resp = await fetchMyMPAs();
      console.log('My MPAs Response:', resp);

      // Combine staging and approved MPAs
      const stagingMPAs = (resp.data?.staging || []).map((item: any) => ({
        ...transformPendingMPA(item),
        _uploadStatus: item.upload_status || 'pending'
      }));

      const approvedMPAs = (resp.data?.approved || []).map((item: any) => ({
        ...item,
        _uploadStatus: 'approved'
      }));

      // Combine both arrays
      const allMyMPAs = [...stagingMPAs, ...approvedMPAs];

      // Apply client-side search if needed
      let filteredMPAs = allMyMPAs;
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.trim().toLowerCase();
        filteredMPAs = allMyMPAs.filter((mpa: any) =>
          mpa.complete_name?.toLowerCase().includes(query)
        );
      }

      // Apply client-side sorting if needed
      if (sortField.value) {
        filteredMPAs.sort((a: any, b: any) => {
          const aVal = a[sortField.value!];
          const bVal = b[sortField.value!];
          const multiplier = sortOrder.value === 'asc' ? 1 : -1;

          if (aVal == null) return 1;
          if (bVal == null) return -1;

          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return (aVal - bVal) * multiplier;
          }

          return String(aVal).localeCompare(String(bVal)) * multiplier;
        });
      }

      // Apply client-side pagination
      const startIndex = (currentPage.value - 1) * rows.value;
      const endIndex = startIndex + rows.value;

      mpas.value = filteredMPAs.slice(startIndex, endIndex);
      totalRecords.value = filteredMPAs.length;
    } else if (showPendingMPAs.value) {
      // Fetch pending MPAs from store (which calls /upload/queue)
      await mpaStore.loadPendingMPAs();
      // Transform nested data to flat structure for table
      mpas.value = (pendingMPAs.value || []).map(transformPendingMPA);
      totalRecords.value = mpas.value.length;
    } else {
      // Fetch regular approved MPAs
      const baseParams = {
        _page: currentPage.value,
        _limit: rows.value
      };

      const params = {
        ...baseParams,
        ...(sortField.value ? { _sort: sortField.value, _order: sortOrder.value } : {}),
        ...(searchQuery.value.trim()
          ? { q: searchQuery.value.trim() }
          : {})
        ,...(filterQuery.value
          ? { filter: filterQuery.value }
          : {})
      };

      const resp = await fetchMPADatalist(params);
      console.log('API Response:', resp);

      // Parse response - data is in 'rows', total count is in 'count'
      mpas.value = resp.data?.rows || [];
      totalRecords.value = resp.data?.count || 0;
    }
  } catch (error) {
    console.error('Error fetching MPAs:', error);
  } finally {
    loading.value = false;
  }
};

const fetchAllMPAsForExport = async (): Promise<Record<string, unknown>[]> => {
  if (showMyMPAs.value) {
    const resp = await fetchMyMPAs();
    const stagingMPAs = (resp.data?.staging || []).map((item: any) => ({
      ...transformPendingMPA(item),
      _uploadStatus: item.upload_status || 'pending'
    }));
    const approvedMPAs = (resp.data?.approved || []).map((item: any) => ({
      ...item,
      _uploadStatus: 'approved'
    }));
    let allMyMPAs = [...stagingMPAs, ...approvedMPAs];

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase();
      allMyMPAs = allMyMPAs.filter((mpa: any) => mpa.complete_name?.toLowerCase().includes(query));
    }

    if (sortField.value) {
      allMyMPAs.sort((a: any, b: any) => {
        const aVal = a[sortField.value!];
        const bVal = b[sortField.value!];
        const multiplier = sortOrder.value === 'asc' ? 1 : -1;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * multiplier;
        return String(aVal).localeCompare(String(bVal)) * multiplier;
      });
    }

    return allMyMPAs as Record<string, unknown>[];
  }

  if (showPendingMPAs.value) {
    await mpaStore.loadPendingMPAs();
    return ((pendingMPAs.value || []).map(transformPendingMPA)) as Record<string, unknown>[];
  }

  const params = {
    _page: 1,
    _limit: totalRecords.value > 0 ? totalRecords.value : 10000,
    ...(sortField.value ? { _sort: sortField.value, _order: sortOrder.value } : {}),
    ...(searchQuery.value.trim() ? { q: searchQuery.value.trim() } : {}),
    ...(filterQuery.value ? { filter: filterQuery.value } : {})
  };

  const resp = await fetchMPADatalist(params);
  const rows = resp.data?.rows || [];
  return rows as Record<string, unknown>[];
};

// Watch showPendingMPAs and showMyMPAs for changes and refresh data
watch([showPendingMPAs, showMyMPAs], async (newValues, oldValues) => {
  if (newValues[0] !== oldValues[0] || newValues[1] !== oldValues[1]) {
    // Reset pagination, filters, and sorting when switching views
    currentPage.value = 1;
    searchQuery.value = '';
    filterQuery.value = '';
    sortField.value = null;
    sortOrder.value = 'asc';
    selectedProvinces.value = [];

    // Clear filter values in data table
    if (dataTableRef.value?.filterValues) {
      dataTableRef.value.filterValues = {};
    }

    await fetchData();
  }
});

watch(
  () => authStore.user,
  async (user) => {
    // On logout, force the default list view (Approved MPAs)
    if (!user && (showPendingMPAs.value || showMyMPAs.value)) {
      showPendingMPAs.value = false;
      showMyMPAs.value = false;
      await fetchData();
    }
  }
);

const setActiveView = (view: 'approved' | 'my-mpas' | 'pending') => {
  showPendingMPAs.value = view === 'pending';
  showMyMPAs.value = view === 'my-mpas';
};

const openCreateForm = () => {
  addMPAFormRef.value?.open();
};

const navigateToDetails = (mpaId: number | string) => {
  router.push({ name: 'mpas-details', params: { id: mpaId } });
};

const normalizeOrdinances = (raw: Array<Record<string, unknown>>) =>
  (raw ?? []).filter(o => o.id != null).map(o => ({
    id: o.id,
    val: o.name ?? o.val,
    attach: o.link ?? o.attach,
    year: o.year ?? null,
    type: o.type ?? null
  }));

const navigateToPendingDetails = (stagingId: number | string, row?: Record<string, unknown>) => {
  if (row) {
    // row may be a transformed flat record (from transformPendingMPA) or already flat (my-mpas)
    // Prefer _raw to get original data; handle both GeoJSON-nested and flat shapes
    const raw = (row._raw as Record<string, unknown>) ?? row;
    const feature = (raw.features as Array<{ properties: Record<string, unknown> }>)?.[0];
    const src: Record<string, unknown> = feature?.properties ?? raw;
    mpaStore.pendingMpaData = {
      staging_id: raw.staging_id ?? raw.id ?? stagingId,
      complete_name: src.complete_name ?? row.complete_name,
      type: src.type ?? row.type,
      status: raw.upload_status ?? src.upload_status ?? row._uploadStatus ?? 'pending',
      year_established: src.year_established ?? row.year_established,
      date_established: src.date_established ?? row.date_established,
      province: src.province ?? row.province,
      municipality: src.municipality ?? row.municipality,
      barangay: src.barangay ?? row.barangay,
      total_area: src.total_area ?? row.total_area,
      core_area: src.core_area ?? row.core_area,
      buffer_area: src.buffer_area ?? row.buffer_area,
      latitude: src.latitude ?? row.latitude,
      longitude: src.longitude ?? row.longitude,
      mgt_body: src.mgt_body ?? row.mgt_body,
      mpa_plan: src.mpa_plan ?? row.mpa_plan,
      network: src.network ?? row.network,
      remarks: src.remarks ?? row.remarks,
      is_nipas: src.is_nipas ?? row.is_nipas,
      uploaded_by: src.uploaded_by ?? raw.uploaded_by ?? row.uploaded_by,
      rejection_reason: raw.rejection_reason ?? row.rejection_reason,
      ordinances: normalizeOrdinances((raw.ordinances ?? row.ordinances) as Array<Record<string, unknown>>)
    };
  }
  router.push({ name: 'mpas-pending-details', params: { id: stagingId } });
};

const handleRowClick = (row: any) => {
  if (showPendingMPAs.value) {
    navigateToPendingDetails(row.staging_id, row);
  } else if (showMyMPAs.value) {
    // For My MPAs, check if it's staging or approved
    const status = (row._uploadStatus as string || '').toLowerCase();
    if ((status === 'pending' || status === 'rejected') && row.staging_id) {
      navigateToPendingDetails(row.staging_id, row);
    } else {
      navigateToDetails(row.id);
    }
  } else {
    // For approved MPAs, use the regular MPA details route
    navigateToDetails(row.id);
  }
};

const handleCreateMPA = (data: Record<string, any>) => {
  console.log('Creating new MPA:', data);
  // TODO: Implement API call to create MPA
  // After successful creation, refresh the list
  fetchData();
};

const handleApprove = (stagingId: number, mpaName: string) => {
  approvingStagingId.value = stagingId;
  approvingMPAName.value = mpaName || `ID ${stagingId}`;
  approveModalOpen.value = true;
};

const confirmApprove = async () => {
  if (!approvingStagingId.value) return;

  approveModalOpen.value = false;
  isProcessing.value = true;

  try {
    const response = await approvePendingMPA(approvingStagingId.value);
    if (response.data.success) {
      messageModalTitle.value = 'MPA Approved';
      messageModalContent.value = `MPA approved successfully! New MPA ID: ${response.data.new_mpa_id}`;
      messageModalType.value = 'success';
      messageModalOpen.value = true;

      // Refresh the pending MPAs list
      await fetchData();
    }
  } catch (error: any) {
    console.error('Error approving MPA:', error);
    const errorMsg = error.response?.data?.error || 'Failed to approve MPA';
    messageModalTitle.value = 'Approval Failed';
    messageModalContent.value = errorMsg;
    messageModalType.value = 'error';
    messageModalOpen.value = true;
  } finally {
    isProcessing.value = false;
    approvingStagingId.value = null;
    approvingMPAName.value = '';
  }
};

const cancelApprove = () => {
  approveModalOpen.value = false;
  approvingStagingId.value = null;
  approvingMPAName.value = '';
};

const handleReject = (stagingId: number, mpaName: string) => {
  rejectingStagingId.value = stagingId;
  rejectingMPAName.value = mpaName || `ID ${stagingId}`;
  rejectionReason.value = '';
  rejectModalOpen.value = true;
};

const confirmReject = async () => {
  if (!rejectionReason.value.trim() || !rejectingStagingId.value) {
    return;
  }

  isProcessing.value = true;
  try {
    const response = await rejectPendingMPA(rejectingStagingId.value, rejectionReason.value.trim());
    if (response.data.success) {
      rejectModalOpen.value = false;
      rejectingStagingId.value = null;
      rejectingMPAName.value = '';
      rejectionReason.value = '';

      messageModalTitle.value = 'MPA Rejected';
      messageModalContent.value = 'MPA rejected successfully. The uploader will be notified via email.';
      messageModalType.value = 'success';
      messageModalOpen.value = true;

      // Refresh the pending MPAs list
      await fetchData();
    }
  } catch (error: any) {
    console.error('Error rejecting MPA:', error);
    const errorMsg = error.response?.data?.error || 'Failed to reject MPA';
    messageModalTitle.value = 'Rejection Failed';
    messageModalContent.value = errorMsg;
    messageModalType.value = 'error';
    messageModalOpen.value = true;
  } finally {
    isProcessing.value = false;
  }
};

const cancelReject = () => {
  rejectModalOpen.value = false;
  rejectingStagingId.value = null;
  rejectingMPAName.value = '';
  rejectionReason.value = '';
};

const pendingRowContextMenu = (row: any) => {
  return [
    {
      title: 'Approve MPA',
      icon: 'check',
      color: 'green',
      action: () => handleApprove(row.staging_id, row.complete_name)
    },
    {
      title: 'Reject MPA',
      icon: 'xmark',
      color: 'red',
      action: () => handleReject(row.staging_id, row.complete_name)
    }
  ];
};

onMounted(async () => {
  await optionsStore.fetchOptions();
  await fetchData();
});
</script>

<style>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background-color: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background-color: transparent;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: #374151;
  background-color: #e5e7eb;
}

.toggle-btn.active {
  background-color: white;
  color: #1f2937;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.controls-section {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.search-input {
  width: 300px;
}



.rejection-reason-field {
  margin-top: 1rem;
}

.reason-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
}

.reason-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;
}

.reason-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reason-textarea::placeholder {
  color: #9ca3af;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-approved {
  background-color: #d1fae5;
  color: #065f46;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-rejected {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-container {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
}

.rejection-info-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 0.875rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  line-height: 1;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.rejection-info-icon:hover {
  color: #dc2626;
}
</style>
