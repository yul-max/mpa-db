<template>
  <div class="generic-datatable-container">
    <div class="datatable-header">
      <div class="datatable-header-main">
        <slot name="header"></slot>
      </div>
      <div class="datatable-header-actions">
        <slot name="header-actions"></slot>
        <button
          class="filter-button"
          :class="{
            'filter-button-open': filtersOpen,
            'filter-button-closed': !filtersOpen && hasActiveFilters
          }"
          type="button"
          @click="toggleFilters"
        >
          <FontAwesomeIcon :icon="['fas', 'filter']" class="filter-icon" />
          Filter
        </button>
        <button
          class="export-button"
          :class="{ 'export-button-disabled': exportDisabled }"
          type="button"
          :disabled="exportDisabled"
          @click="openExportConfirm"
        >
          <FontAwesomeIcon :icon="['fas', 'file-zipper']" class="filter-icon" />
          Export
        </button>
        <Button
          v-if="showCreateButton"
          type="button"
          class="create-button"
          @click="emit('create')"
        >
          <FontAwesomeIcon :icon="['fas', 'plus']" class="button-icon" />
          <span>Create</span>
        </Button>
      </div>
    </div>

    <div v-if="filtersOpen" class="filter-panel">
      <Dropdown
        icon="filter"
        title="Add Filter"
        :items="filterColumnOptions"
      />
      <div v-if="activeFilters.length" class="filter-list">
        <div v-for="filter in activeFilters" :key="filter.field" class="filter-row">
          <component
            :is="getFilterComponent(filter)"
            v-model="filterValues[filter.field]"
            class="filter-input"
            v-bind="getFilterProps(filter)"
          />
          <button
            type="button"
            class="filter-remove"
            @click="removeFilter(filter.field)"
          >
            <FontAwesomeIcon :icon="['fas', 'x']" class="filter-remove-icon" />
            Remove
          </button>
        </div>
      </div>
    </div>

    <div class="datatable-wrapper" :class="{ 'loading': loading }">
      <DataTable
        :value="rows"
        :paginator="true"
        :rows="pageSize"
        :totalRecords="totalRecords"
        :loading="loading"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        :rowsPerPageOptions="[10, 20, 50]"
        currentPageReportTemplate="Showing {first} to {last}"
        :sortField="sortField"
        :sortOrder="sortOrder"
        responsiveLayout="scroll"
        class="p-datatable-striped generic-datatable"
        lazy
        @page="onPageChange"
        @sort="onSort"
        @row-click="onRowClick"
        @row-contextmenu="onRowContextMenu"
      >
        <template v-for="(col, index) in columns" :key="col.field">
          <Column v-if="col.show !== false" :field="col.field" :sortable="false">
            <template #header>
              <div
                class="column-header-wrapper"
                :class="{ 'locked-header-wrapper': col.locked }"
                :style="{
                  width: getColumnWidth(col) + 'px',
                  ...(col.locked && { left: getLockPosition(index) + 'px', zIndex: 20 })
                }"
              >
                <div
                  class="column-header"
                  :class="{ 'locked-header': col.locked }"
                  @click.prevent="openContextMenu"
                >
                  <span v-if="col.locked" class="lock-icon">
                    <FontAwesomeIcon :icon="['fas', 'lock']" />
                  </span>
                  <span class="column-title">{{ col.header }}</span>
                  <span
                    v-if="col.sort_column && col.sortable"
                    class="sort-indicator"
                    @click.stop="toggleSort(col)"
                  >
                    <FontAwesomeIcon :icon="['fas', getHeaderSortIcon(col)]" />
                  </span>
                </div>
              </div>
            </template>
            <template #body="slotProps">
              <div
                class="cell-wrapper"
                :class="{ 'locked-cell': col.locked }"
                :style="{
                  width: getColumnWidth(col) + 'px',
                  ...(col.locked && { left: getLockPosition(index) + 'px', zIndex: 9 })
                }"
              >
                <slot :name="`cell-${col.field}`" :data="slotProps.data">
                  <RenderCell :col="col" :row="slotProps.data" />
                </slot>
              </div>
            </template>
          </Column>
        </template>
      </DataTable>
    </div>

    <ContextMenu
      v-if="contextMenuOpen"
      :actions="contextMenuActions"
      :position="contextMenuPosition"
      @close="contextMenuOpen = false"
      @submenu-toggle="handleColumnToggle"
    />

    <ConfirmModal
      :open="exportConfirmOpen"
      title="Export CSV"
      :message="exportConfirmMessage"
      confirm-label="Export CSV"
      cancel-label="Cancel"
      :disable-confirm="!isFilenameValid"
      @confirm="confirmExport"
      @cancel="cancelExport"
    >
      <template #content>
        <div class="export-modal-content">
          <label for="csv-filename" class="export-label">File name (optional)</label>
          <input
            id="csv-filename"
            v-model="exportFilenameInput"
            class="export-filename-input"
            type="text"
            placeholder="Leave blank for default"
          />
          <p v-if="!isFilenameValid" class="export-error">
            Use letters, numbers, spaces, dash, or underscore only.
          </p>
          <p class="export-columns-note">
            Visible columns in CSV: {{ visibleColumnHeaders.join(', ') || 'None' }}
          </p>
        </div>
      </template>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h, type PropType } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import MultiSelect from 'primevue/multiselect';
import type { ColumnDef, ContextAction } from '@/types/ui';
import ContextMenu from './ContextMenu.vue';
import Dropdown from './Dropdown.vue';
import Button from './Button.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useAuthStore } from '@/stores/auth';
import InputText from '@/components/ui/InputText.vue';
import SwitchField from '@/components/ui/fields/SwitchField.vue';
import ConfirmModal from './ConfirmModal.vue';

interface Props {
  /** Current page rows rendered by the DataTable. */
  rows: any[];
  /** Declarative column definitions controlling render/sort/filter/export behavior. */
  columns: ColumnDef[];
  /** Total records in backing dataset, used by paginator. */
  totalRecords: number;
  /** Loading flag for busy table state. */
  loading: boolean;
  sortField?: string;
  sortOrder?: number;
  pageSize?: number;
  exportListName?: 'MPA' | 'User';
  /** Optional callback to fetch full dataset when exporting all rows. */
  exportAllRows?: () => Promise<Record<string, unknown>[]>;
  /** Optional per-row context actions used by context menu workflow. */
  rowContextMenuActions?: (row: any) => ContextAction[];
}

const RenderCell = defineComponent({
  name: 'RenderCell',
  props: {
    col: {
      type: Object as PropType<ColumnDef>,
      required: true
    },
    row: {
      type: Object as PropType<Record<string, any>>,
      required: true
    }
  },
  setup(props) {
    return () => {
      if (props.col.render) {
        return props.col.render(props.row);
      }
      const value = props.row?.[props.col.field];
      if (props.col.type === 'boolean') {
        return h(
          'span',
          value
            ? [h(FontAwesomeIcon as any, { icon: ['fas', 'check'], class: 'text-green-600' })]
            : [h(FontAwesomeIcon as any, { icon: ['fas', 'x'], class: 'text-red-600' })]
        );
      }
      if (props.col.type === 'string' && value === '') {
        return h('span', 'Not specified');
      }
      return h('span', value ?? '');
    };
  }
});

interface Emits {
  /** PrimeVue page event payload. */
  (e: 'page', event: any): void;
  /** PrimeVue sort event payload. */
  (e: 'sort', event: any): void;
  /** Emitted when active filters change. */
  (e: 'filter-change', filters: Record<string, unknown>): void;
  (e: 'create'): void;
  /** Emits raw clicked row data for parent-route navigation. */
  (e: 'row-click', row: Record<string, unknown>): void;
}

const props = withDefaults(defineProps<Props>(), {
  sortOrder: 1,
  pageSize: 10,
  exportListName: 'MPA'
});

const authStore = useAuthStore();
const showCreateButton = computed(() => {
  return !!authStore.user && (authStore.user.user_type === 1 || authStore.user.user_type === 2);
});

const emit = defineEmits<Emits>();

const contextMenuOpen = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuColumn = ref<ColumnDef | null>(null);
const contextMenuRow = ref<any>(null);
const isRowContextMenu = ref(false);
const originalPositions = new Map<ColumnDef, number>();
const filtersOpen = ref(false);
const filterValues = ref<Record<string, unknown>>({});
const activeFilters = ref<ColumnDef[]>([]);
const filterOptionsByField = ref<Record<string, Array<{ label: string; value: unknown }>>>({});
const hasActiveFilters = computed(() => activeFilters.value.length > 0);
const exportConfirmOpen = ref(false);
const exportFilenameInput = ref('');
const exporting = ref(false);

const filterComponentMap: Record<string, unknown> = {
  InputText,
  MultiSelect,
  SwitchField
};

const visibleColumns = computed(() => props.columns.filter((col) => col.show !== false));
const visibleColumnHeaders = computed(() => visibleColumns.value.map((c) => c.header));
const exportDisabled = computed(() => exporting.value || props.totalRecords === 0 || visibleColumns.value.length === 0);

const defaultExportFilename = computed(() => {
  const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${props.exportListName}List_${uuid}`;
});

const sanitizedFilename = computed(() => {
  const raw = exportFilenameInput.value.trim();
  if (!raw) return defaultExportFilename.value;
  return raw.replace(/\s+/g, ' ').trim();
});

const isFilenameValid = computed(() => {
  const raw = exportFilenameInput.value.trim();
  if (!raw) return true;
  if (raw.length > 120) return false;
  return /^[A-Za-z0-9 _-]+$/.test(raw);
});

const exportConfirmMessage = computed(() => {
  return hasActiveFilters.value
    ? 'You are about to export only the filtered results shown in the table as a CSV file.'
    : 'You are about to export all entries shown in the table as a CSV file.';
});

const openExportConfirm = () => {
  if (exportDisabled.value) return;
  exportFilenameInput.value = '';
  exportConfirmOpen.value = true;
};

const cancelExport = () => {
  exportConfirmOpen.value = false;
  exportFilenameInput.value = '';
};

const csvEscape = (value: unknown): string => {
  const normalized = String(value ?? '');
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
};

const formatCsvCell = (row: Record<string, unknown>, col: ColumnDef): string => {
  const value = col.exportValue ? col.exportValue(row as Record<string, any>) : row?.[col.field];
  if (col.type === 'boolean') {
    return (value ? 'YES' : 'NO');
  }
  if (value === null || value === undefined) return '';
  return String(value);
};

const confirmExport = async () => {
  if (!isFilenameValid.value) return;

  exporting.value = true;
  try {
    const exportRows = props.exportAllRows ? await props.exportAllRows() : (props.rows as Record<string, unknown>[]);
    const headers = visibleColumns.value.map((col) => col.header);
    const body = exportRows.map((row) =>
      visibleColumns.value.map((col) => csvEscape(formatCsvCell(row as Record<string, unknown>, col))).join(',')
    );
    const csv = [headers.map(csvEscape).join(','), ...body].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedFilename.value}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    cancelExport();
  } catch (error) {
    console.error('Failed to export CSV:', error);
  } finally {
    exporting.value = false;
  }
};

const filterColumnOptions = computed(() => {
  const activeFields = new Set(activeFilters.value.map((filter) => filter.field));
  return props.columns
    .filter((col) => !!col.filter && !activeFields.has(col.field))
    .map((col) => ({
      title: col.header,
      handler: async () => addFilter(col)
    }));
});

const contextMenuActions = computed(() => {
  // If this is a row context menu, return row-specific actions
  if (isRowContextMenu.value && contextMenuRow.value && props.rowContextMenuActions) {
    return props.rowContextMenuActions(contextMenuRow.value);
  }

  // Otherwise, return column header actions
  const baseActions: ContextAction[] = [
    {
      title: 'Visible Columns',
      icon: 'columns',
      submenu: props.columns.map((col) => ({
        title: col.header,
        toggled: col.show !== false
      }))
    }
  ];

  if (contextMenuColumn.value?.sort_column) {
    baseActions.push({
      title: 'Sort',
      icon: getSortIcon(contextMenuColumn.value),
      action: () => toggleSort(contextMenuColumn.value!)
    });
  }

  // Add lock/unlock action if context menu is for a column
  if (contextMenuColumn.value) {
    if (contextMenuColumn.value.locked) {
      baseActions.push({
        title: 'Unlock Column',
        icon: 'lock-open',
        action: () => unlockColumn(contextMenuColumn.value!)
      });
    } else {
      baseActions.push({
        title: 'Lock Column',
        icon: 'lock',
        action: () => lockColumn(contextMenuColumn.value!)
      });
    }
  }

  return baseActions as ContextAction[];
});

const onPageChange = (event: any) => {
  emit('page', event);
};

const onRowClick = (event: any) => {
  emit('row-click', event.data as Record<string, unknown>);
};

const toggleFilters = () => {
  filtersOpen.value = !filtersOpen.value;
};

const addFilter = (col: ColumnDef) => {
  if (!col.filter) return;
  if (activeFilters.value.some((filter) => filter.field === col.field)) return;
  activeFilters.value.push(col);
  if (col.filter === 'MultiSelect') {
    loadFilterOptions(col);
  }
};

const removeFilter = (field: string) => {
  activeFilters.value = activeFilters.value.filter((filter) => filter.field !== field);
  const nextFilters = { ...filterValues.value };
  delete nextFilters[field];
  filterValues.value = nextFilters;
  emit('filter-change', { ...filterValues.value });
};

const normalizeFilterOptions = (data: Array<{ label: string; value: unknown } | string>) => {
  return data.map((item) => {
    if (typeof item === 'string') {
      return { label: item, value: item };
    }
    return { label: item.label, value: item.value };
  });
};

const loadFilterOptions = async (col: ColumnDef) => {
  if (!col.source) return;
  if (col.source.data) {
    filterOptionsByField.value[col.field] = normalizeFilterOptions(col.source.data);
    return;
  }
  if (col.source.url) {
    try {
      const resp = await fetch(col.source.url);
      const data = await resp.json();
      if (Array.isArray(data)) {
        filterOptionsByField.value[col.field] = normalizeFilterOptions(data);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }
};

const getFilterComponent = (col: ColumnDef) => {
  if (!col.filter) return InputText;
  return filterComponentMap[col.filter] || col.filter;
};

const getFilterProps = (col: ColumnDef) => {
  const baseProps = { placeholder: col.header };
  if (col.filter === 'SwitchField') {
    return { label: col.header };
  }
  if (col.filter === 'MultiSelect') {
    return {
      ...baseProps,
      options: filterOptionsByField.value[col.field] || [],
      optionLabel: 'label',
      optionValue: 'value',
      display: 'chip',
      showToggleAll: false
    };
  }
  return baseProps;
};


watch(
  filterValues,
  (value) => {
    emit('filter-change', { ...value });
  },
  { deep: true }
);

// Watch columns to reload filter options when source data changes
watch(
  () => props.columns,
  () => {
    // Reload filter options for active MultiSelect filters
    activeFilters.value.forEach((filter) => {
      if (filter.filter === 'MultiSelect' && filter.source?.data) {
        const currentColumn = props.columns.find((col) => col.field === filter.field);
        if (currentColumn?.source?.data) {
          filterOptionsByField.value[filter.field] = normalizeFilterOptions(currentColumn.source.data);
        }
      }
    });
  },
  { deep: true }
);

const onSort = (event: any) => {
  emit('sort', event);
};

const toggleSort = (column: ColumnDef) => {
  if (!column.sort_column) return;
  const isSameField = props.sortField === column.sort_column;
  const nextOrder = isSameField && props.sortOrder === 1 ? -1 : 1;
  emit('sort', { sortField: column.sort_column, sortOrder: nextOrder });
  contextMenuOpen.value = false;
};

const isActiveSort = (column: ColumnDef) => {
  return !!column.sort_column && props.sortField === column.sort_column;
};

const getSortIcon = (column: ColumnDef) => {
  if (!isActiveSort(column)) return 'sort';
  return props.sortOrder === 1 ? 'sort-up' : 'sort-down';
};

const getHeaderSortIcon = (column: ColumnDef) => {
  if (!isActiveSort(column)) return 'sort';
  return props.sortOrder === 1 ? 'sort-up' : 'sort-down';
};

const openContextMenu = (event: MouseEvent) => {
  // Find which column header was clicked
  const headerElement = (event.currentTarget as HTMLElement).closest('th');
  if (!headerElement) return;

  const columnHeader = headerElement.textContent?.trim() || '';
  contextMenuColumn.value = props.columns.find((col) => col.header === columnHeader) || null;
  isRowContextMenu.value = false;
  contextMenuRow.value = null;
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  contextMenuOpen.value = true;
};

const onRowContextMenu = (event: any) => {
  if (!props.rowContextMenuActions) return;

  event.originalEvent.preventDefault();
  contextMenuRow.value = event.data;
  isRowContextMenu.value = true;
  contextMenuColumn.value = null;
  contextMenuPosition.value = {
    x: event.originalEvent.clientX,
    y: event.originalEvent.clientY
  };
  contextMenuOpen.value = true;
};

const lockColumn = (col: ColumnDef) => {
  if (col.locked) return; // Already locked

  // Store original position if not already stored
  if (!originalPositions.has(col)) {
    originalPositions.set(col, props.columns.indexOf(col));
  }

  // Remove from current position
  const index = props.columns.indexOf(col);
  if (index > -1) {
    // eslint-disable-next-line vue/no-mutating-props
    props.columns.splice(index, 1);
  }

  // Add to beginning and mark as locked
  col.locked = true;
  // eslint-disable-next-line vue/no-mutating-props
  props.columns.unshift(col);
};

const unlockColumn = (col: ColumnDef) => {
  col.locked = false;

  // Find original position
  const originalPos = originalPositions.get(col);
  if (originalPos !== undefined) {
    // Remove from current position
    const currentIndex = props.columns.indexOf(col);
    if (currentIndex > -1) {
      // eslint-disable-next-line vue/no-mutating-props
      props.columns.splice(currentIndex, 1);
    }

    // Insert at original position
    // eslint-disable-next-line vue/no-mutating-props
    props.columns.splice(originalPos, 0, col);
    originalPositions.delete(col);
  }
};

const handleColumnToggle = (actionIndex: number, itemIndex: number, value: boolean) => {
  if (actionIndex === 0) {
    // Don't allow hiding the last visible column
    if (!value) {
      const visibleCount = props.columns.filter((col) => col.show !== false).length;
      if (visibleCount === 1) {
        return;
      }
    }

    // Toggle the "show" property of the column
    const col = props.columns[itemIndex];
    if (col) {
      col.show = value;
    }
  }
};

const getLockPosition = (columnIndex: number): number => {
  let position = 0;
  for (let i = 0; i < columnIndex && i < props.columns.length; i++) {
    const col = props.columns[i];
    if (col && col.locked && col.show !== false) {
      position += getColumnWidth(col);
    }
  }
  return position;
};

const getColumnWidth = (col: ColumnDef): number => {
  return col.colWidth || 200; // Default to 200px if not specified
};

defineExpose({
  filterValues
});
</script>

<style scoped>
.column-header-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
}

.column-header-wrapper.locked-header-wrapper {
  position: sticky;
  background-color: #d1d5db;
  z-index: 20;
}

.column-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.column-header.locked-header {
  background-color: #d1d5db;
}

.lock-icon {
  font-size: 0.75rem;
  color: #4b5563;
  flex-shrink: 0;
}

.sort-indicator {
  display: inline-flex;
  align-items: center;
  color: #6b7280;
  margin-left: auto;
  padding-left: 0.5rem;
  font-size: 0.8rem;
}

.column-title {
  display: inline-flex;
  align-items: center;
}

.cell-wrapper {
  padding: 0.75rem;
}

.locked-cell {
  position: sticky;
  background-color: #ffffff;
  z-index: 9;
  border-right: 1px solid #f3f4f6;
}

.generic-datatable-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.datatable-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
  margin-bottom: 1rem;
}

.datatable-header-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.datatable-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #1f2937;
  height: 42px;
  padding: 0 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.export-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #1f2937;
  height: 42px;
  padding: 0 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.export-button:hover:not(:disabled) {
  background: #ffffff;
  border-color: #2563eb;
  color: #2563eb;
}

.export-button-disabled,
.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-modal-content {
  margin-top: 0.5rem;
}

.export-label {
  display: block;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.35rem;
}

.export-filename-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.625rem;
  font-size: 0.875rem;
}

.export-filename-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.export-error {
  margin-top: 0.35rem;
  color: #dc2626;
  font-size: 0.8rem;
}

.export-columns-note {
  margin-top: 0.5rem;
  color: #4b5563;
  font-size: 0.8rem;
}

.filter-button-open {
  border-color: #2563eb;
  color: #2563eb;
  background: #ffffff;
}

.filter-button-closed {
  border-color: transparent;
  background: #2563eb;
  color: #ffffff;
}

.filter-button:hover {
  background: #ffffff;
  border-color: #2563eb;
  color: #2563eb;
}

.filter-button.filter-button-open:hover {
  background: #ffffff;
  border-color: #2563eb;
  color: #2563eb;
}

.filter-button.filter-button-closed:hover {
  background: #2563eb;
  border-color: transparent;
  color: #ffffff;
}

.filter-icon {
  font-size: 0.85rem;
}

.create-button {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem !important;
  border: 1px solid #d1d5db !important;
  border-radius: 0.375rem !important;
  background-color: white !important;
  color: #1f2937 !important;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.create-button:hover {
  background-color: #ffffff !important;
  border-color: #2563eb !important;
  color: #2563eb !important;
}

.button-icon {
  font-size: 1rem;
}

.datatable-wrapper {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.filter-panel {
  margin-bottom: 1rem;
  background: #e5e7eb;
  padding: 1rem;
  border-radius: 0.375rem;
}


.filter-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.filter-input {
  width: 320px;
  flex: 0 0 320px;
}

.filter-input :deep(input) {
  background: #ffffff;
}

.filter-remove {
  border: none;
  background: transparent;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
}

.filter-remove:hover {
  color: #111827;
}

.filter-remove-icon {
  font-size: 0.6rem;
}

.datatable-wrapper.loading {
  height: 600px;
}

:deep(.generic-datatable) {
  margin: 0;
  border: none;
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.generic-datatable .p-datatable-wrapper) {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
}

:deep(.generic-datatable .p-datatable-thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f3f4f6;
}

:deep(.generic-datatable thead > tr > th) {
  background-color: #f3f4f6;
  font-weight: 600;
  padding: 0;
  border-right: 1px solid #e5e7eb;
}

:deep(.generic-datatable tbody > tr > td) {
  padding: 0;
  border-right: 1px solid #f3f4f6;
}

:deep(.p-paginator) {
  position: sticky;
  bottom: 0;
  top: auto;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  flex-shrink: 0;
  z-index: 5;
}

:deep(.p-paginator-left) {
  gap: 1rem;
}

:deep(.p-paginator-rpp-options) {
  gap: 0.5rem;
}

:deep(.p-paginator-rpp-options .p-dropdown) {
  width: auto;
  min-width: 70px;
}

:deep(.p-paginator-rpp-options .p-dropdown .p-dropdown-label) {
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
}

:deep(.p-paginator-rpp-options .p-dropdown .p-dropdown-trigger) {
  padding: 0.375rem 0.5rem;
}

:deep(.p-paginator-rpp-options .p-dropdown.p-focus .p-dropdown-label) {
  padding: 0.375rem 0.5rem;
}

:deep(.p-paginator-pages) {
  gap: 0.25rem;
}

:deep(.p-paginator-page) {
  padding: 0.375rem 0.625rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s;
  background-color: transparent;
  color: #666;
}

:deep(.p-paginator-page:hover) {
  background-color: #e5e7eb;
  color: #333;
}

:deep(.p-paginator-page.p-highlight) {
  background-color: #0369a1;
  color: white;
  border: none;
}

:deep(.p-paginator-first,
      .p-paginator-prev,
      .p-paginator-next,
      .p-paginator-last) {
  border: none;
  border-radius: 0.375rem;
  padding: 0.375rem 0.625rem;
  cursor: pointer;
  background-color: transparent;
  color: #666;
}
</style>
