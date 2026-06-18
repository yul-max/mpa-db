<template>
  <div class="details-content" :class="{ 'details-content--tabbed': tabs && tabs.length }">
    <!-- Header -->
    <div class="details-header">
      <div class="details-header-main">
        <button v-if="backLink" type="button" class="back-link" @click="handleBack">
          <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> {{ backLabel }}
        </button>
        <div class="details-title-row">
          <div class="details-title-block">
            <h1 class="details-title">{{ title }}</h1>
            <div v-if="subtitle" class="subtitle-container">
              <div class="subtitle-line">
                <span class="details-subtitle-inline">{{ subtitle.split('\n')[0] }}</span>
                <slot name="subtitle-actions"></slot>
              </div>
              <div
                v-for="(line, i) in subtitle.split('\n').slice(1)"
                :key="i"
                class="details-subtitle"
              >{{ line }}</div>
            </div>
          </div>
          <div class="details-actions">
            <slot name="actions" :mode="mode"></slot>
            <template v-if="mode === 'edit'">
              <button type="button" class="secondary-button" @click="emit('cancel')">
                {{ cancelLabel }}
              </button>
              <button
                type="button"
                class="edit-button"
                :disabled="disableSave"
                @click="emit('save')"
              >
                {{ saveLabel }}
              </button>
            </template>
            <template v-else>
              <router-link v-if="editLink && canEdit" :to="editLink" class="edit-button">
                <FontAwesomeIcon :icon="['fas', 'edit']" /> {{ editLabel }}
              </router-link>
              <button
                v-else-if="canEdit"
                type="button"
                class="edit-button"
                @click="emit('edit')"
              >
                <FontAwesomeIcon :icon="['fas', 'edit']" /> {{ editLabel }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <Loading />
    </div>

    <!-- Tabbed Layout -->
    <template v-else-if="data && tabs && tabs.length">
      <div class="details-tabbed-layout">
        <div class="details-tab-sidebar">
          <button
            v-for="(tab, index) in tabs"
            :key="tab.label"
            class="tab-item"
            :class="{ active: activeTab === index }"
            @click="activeTab = index"
          >
            <FontAwesomeIcon v-if="tab.icon" :icon="tab.icon" class="tab-icon" />
            {{ tab.label }}
          </button>
        </div>
        <div class="details-tab-content">
          <template v-if="activeSections.length">
            <div v-for="section in activeSections" :key="section.title" class="detail-section">
              <h2>{{ section.title }}</h2>
              <div class="detail-group">
                <div
                  v-for="field in section.fields"
                  :key="field.key"
                  class="detail-item"
                  :class="{ 'full-width': field.fullWidth }"
                >
                  <label>{{ field.label }}</label>
                  <span>
                    <template v-if="mode === 'edit'">
                      <template v-if="hasEditField(field.key) && editModel">
                        <component
                          :is="resolveEditComponentByKey(field.key)"
                          :model-value="editModel[field.key]"
                          @update:model-value="setEditFieldValue(field.key, $event)"
                          v-bind="resolveEditFieldPropsByKey(field.key)"
                        />
                      </template>
                      <template v-else>
                        <slot :name="`edit-field-${field.key}`" :value="getFieldValue(field.key)">
                          <slot :name="`field-${field.key}`" :value="getFieldValue(field.key)">
                            {{ formatValue(getFieldValue(field.key), field) }}
                          </slot>
                        </slot>
                      </template>
                    </template>
                    <template v-else>
                      <slot :name="`field-${field.key}`" :value="getFieldValue(field.key)">
                        {{ formatValue(getFieldValue(field.key), field) }}
                      </slot>
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </template>
          <div v-else :key="activeTabSlotName">
            <slot :name="activeTabSlotName" />
          </div>
        </div>
      </div>
    </template>

    <!-- Details Grid -->
    <div v-else-if="data" class="details-grid">
      <div v-for="section in sections" :key="section.title" class="detail-section">
        <h2>{{ section.title }}</h2>
        <div class="detail-group">
          <div
            v-for="field in section.fields"
            :key="field.key"
            class="detail-item"
            :class="{ 'full-width': field.fullWidth }"
          >
            <label>{{ field.label }}</label>
            <span>
              <template v-if="mode === 'edit'">
                <template v-if="hasEditField(field.key) && editModel">
                  <component
                    :is="resolveEditComponentByKey(field.key)"
                    :model-value="editModel[field.key]"
                    @update:model-value="setEditFieldValue(field.key, $event)"
                    v-bind="resolveEditFieldPropsByKey(field.key)"
                  />
                </template>
                <template v-else>
                  <slot :name="`edit-field-${field.key}`" :value="getFieldValue(field.key)">
                    <slot :name="`field-${field.key}`" :value="getFieldValue(field.key)">
                      {{ formatValue(getFieldValue(field.key), field) }}
                    </slot>
                  </slot>
                </template>
              </template>
              <template v-else>
                <slot :name="`field-${field.key}`" :value="getFieldValue(field.key)">
                  {{ formatValue(getFieldValue(field.key), field) }}
                </slot>
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { type RouteLocationRaw, useRouter } from 'vue-router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Loading from '@/components/ui/Loading.vue';
import { useAuthStore } from '@/stores/auth';
import type { EditFieldDef } from '@/types/edit';

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

interface TabConfig {
  label: string;
  sections: string[];
  icon?: string[];
}

interface Props {
  data: Record<string, any> | null;
  loading?: boolean;
  title: string;
  subtitle?: string;
  sections: SectionConfig[];
  editFields?: EditFieldDef[];
  editModel?: Record<string, any> | null;
  backLink?: string;
  backLabel?: string;
  editLink?: RouteLocationRaw | null;
  mode?: 'view' | 'edit';
  showEdit?: boolean;
  editLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  disableSave?: boolean;
  emptyMessage?: string;
  tabs?: TabConfig[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  backLabel: 'Back',
  emptyMessage: 'No data found',
  mode: 'view',
  showEdit: true,
  editLabel: 'Edit',
  saveLabel: 'Save',
  cancelLabel: 'Cancel',
  disableSave: false
});

const emit = defineEmits<{
  edit: [];
  save: [];
  cancel: [];
}>();

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref(0);

const activeTabSlotName = computed(() => {
  if (!props.tabs || !props.tabs.length) return '';
  const label = props.tabs[activeTab.value]?.label ?? '';
  return `tab-${label.toLowerCase().replace(/\s+/g, '-')}`;
});

const activeSections = computed(() => {
  if (!props.tabs || props.tabs.length === 0) return props.sections;
  const tab = props.tabs[activeTab.value];
  if (!tab) return props.sections;
  return props.sections.filter((s) => tab.sections.includes(s.title));
});
const canEdit = computed(() => !!authStore.user && props.showEdit);

const componentRegistry = {
  InputTextField: defineAsyncComponent(() => import('@/components/ui/fields/InputTextField.vue')),
  DropdownField: defineAsyncComponent(() => import('@/components/ui/fields/DropdownField.vue')),
  SwitchField: defineAsyncComponent(() => import('@/components/ui/fields/SwitchField.vue')),
  FileUploadField: defineAsyncComponent(() => import('@/components/ui/fields/FileUploadField.vue'))
} as const;

const editFieldMap = computed<Record<string, EditFieldDef>>(() => {
  const fields = props.editFields ?? [];
  return fields.reduce((acc, field) => {
    acc[field.key] = field;
    return acc;
  }, {} as Record<string, EditFieldDef>);
});

const resolveEditComponent = (name: EditFieldDef['component']) => {
  return componentRegistry[name] ?? componentRegistry.InputTextField;
};

const hasEditField = (key: string): boolean => {
  return Boolean(editFieldMap.value[key]);
};

const resolveEditComponentByKey = (key: string) => {
  const field = editFieldMap.value[key];
  return resolveEditComponent(field?.component ?? 'InputTextField');
};

const resolveEditFieldPropsByKey = (key: string) => {
  const field = editFieldMap.value[key];
  if (!field) return {};
  return resolveEditFieldProps(field);
};

const resolveEditFieldProps = (field: EditFieldDef) => {
  if (!field.props) return {};
  return typeof field.props === 'function' ? field.props(props.editModel ?? {}) : field.props;
};

const getFieldValue = (key: string) => {
  if (!props.data) return null;
  return props.data[key];
};

const setEditFieldValue = (key: string, value: unknown) => {
  if (!props.editModel) return;
  // eslint-disable-next-line vue/no-mutating-props
  props.editModel[key] = value;
};

const handleBack = () => {
  if (!props.backLink) return;
  if (props.mode === 'edit') {
    emit('cancel');
    return;
  }
  router.push(props.backLink);
};

const formatValue = (value: any, field: FieldConfig): string => {
  if (value === null || value === undefined) return 'N/A';

  // Use custom formatter if provided
  if (field.formatter) {
    return field.formatter(value);
  }

  // Default formatters by type
  switch (field.type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'number':
      return new Intl.NumberFormat('en-US').format(value);
    case 'date':
      return new Date(value).toLocaleDateString('en-US');
    default:
      return String(value);
  }
};
</script>

<style scoped>
.details-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.details-content--tabbed {
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  background-color: #f9fafb;
  z-index: 2;
  padding: 1.5rem 0 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.details-content--tabbed .details-header {
  position: static;
  flex-shrink: 0;
  margin-bottom: 0;
  padding: 1.5rem 2rem 1rem;
}

.details-header-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
}

.back-link {
  color: #3b82f6;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #1e40af;
}

.details-title {
  font-size: 2rem;
  font-weight: bold;
  min-width: 200px;
}

.details-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  white-space: pre-line;
}

.details-subtitle-inline {
  color: #64748b;
  font-size: 0.95rem;
}

.subtitle-container {
  margin-top: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.subtitle-line {
  display: flex;
  align-items: baseline;
  gap: 0;
  flex-wrap: wrap;
}

.details-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.details-title-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.details-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.edit-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  text-decoration: none;
  transition: background-color 0.2s;
  font-size: 0.875rem;
}

.edit-button:hover {
  background-color: #1e40af;
}

.edit-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: #374151;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.secondary-button:hover {
  color: #111827;
  border-color: #9ca3af;
}

.details-tabbed-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 2rem;
  overflow: hidden;
  padding: 2rem;
}

.details-tab-sidebar {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
}

.tab-item {
  padding: 0.75rem 0.5rem;
  text-align: left;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  border: none;
  background: transparent;
  cursor: pointer;
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  transition: color 0.15s, border-left-color 0.15s;
}

.tab-icon {
  width: 1em;
  flex-shrink: 0;
  opacity: 0.7;
}

.tab-item:hover {
  color: #111827;
}

.tab-item.active {
  color: #2563eb;
  border-left-color: #2563eb;
  font-weight: 600;
}

.tab-item.active .tab-icon {
  opacity: 1;
}

.details-tab-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  display: grid;
  gap: 2rem;
  align-content: start;
  padding-bottom: 2rem;
}

.details-grid {
  display: grid;
  gap: 2rem;
}

.detail-section {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.detail-section h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

.detail-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-item span {
  font-size: 1rem;
  color: #1f2937;
  word-break: break-word;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  font-size: 1.125rem;
}
</style>
