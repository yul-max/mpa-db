<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="requestCancel">
    <div class="modal-content">
      <div class="details-content">
        <div class="details-header">
          <h1 class="details-title">Create MPA</h1>
        </div>

        <div class="details-body--tabbed">
          <div class="form-tab-sidebar">
            <button
              v-for="(tab, index) in formTabs"
              :key="tab.label"
              type="button"
              class="tab-item"
              :class="{ active: activeTab === index }"
              @click="activeTab = index"
            >
              <FontAwesomeIcon v-if="tab.icon" :icon="tab.icon" class="tab-icon" />
              {{ tab.label }}
            </button>
          </div>

          <form class="form-tab-content" @submit.prevent="handleSubmit">
            <!-- Basic Information tab -->
            <template v-if="activeTab === 0">
              <div v-for="section in formSections" :key="section.title" class="detail-section">
                <h2>{{ section.title }}</h2>
                <div class="detail-group">
                  <div
                    v-for="field in section.fields"
                    :key="field.key"
                    class="detail-item"
                    :class="{ 'full-width': field.fullWidth }"
                  >
                    <component
                      :is="resolveComponent(field.component)"
                      v-model="(payload as any)[field.key]"
                      v-bind="resolveFieldProps(field)"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- More Info tab -->
            <template v-else-if="activeTab === 1">
              <div class="detail-section">
                <h2>Ordinance Information</h2>
                <div class="ordinance-group">
                  <div
                    v-for="(entry, index) in ordinanceEntries"
                    :key="`ordinance-${index}`"
                    class="ordinance-row"
                  >
                    <div class="detail-item">
                      <InputTextField
                        v-model="entry.link"
                        :label="`Ordinance Link${ordinanceEntries.length > 1 ? ` ${index + 1}` : ''}`"
                        placeholder="Google Drive URL"
                        type="url"
                        autocomplete="off"
                        :error="ordinanceErrors[index]"
                      />
                    </div>
                    <div class="detail-item">
                      <InputTextField
                        v-model="entry.name"
                        :label="`Ordinance Name${ordinanceEntries.length > 1 ? ` ${index + 1}` : ''}`"
                        placeholder="Enter a label for this ordinance"
                        autocomplete="off"
                      />
                    </div>
                    <button
                      v-if="ordinanceEntries.length > 1"
                      type="button"
                      class="filter-remove ordinance-remove"
                      @click="removeOrdinanceEntry(index)"
                    >
                      <FontAwesomeIcon :icon="['fas', 'x']" class="filter-remove-icon" />
                      Remove
                    </button>
                  </div>
                  <button type="button" class="ordinance-add-button" @click="addOrdinanceEntry">
                    <FontAwesomeIcon :icon="['fas', 'plus']" />
                    Add more
                  </button>
                </div>
              </div>

              <div v-for="section in moreInfoSections" :key="section.title" class="detail-section">
                <h2>{{ section.title }}</h2>
                <div class="detail-group">
                  <div
                    v-for="field in section.fields"
                    :key="field.key"
                    class="detail-item"
                    :class="{ 'full-width': field.fullWidth }"
                  >
                    <component
                      :is="resolveComponent(field.component)"
                      v-model="(payload as any)[field.key]"
                      v-bind="resolveFieldProps(field)"
                    />
                  </div>
                </div>
              </div>
            </template>
          </form>
        </div>

        <div class="details-footer">
          <button type="button" class="secondary-button" @click="requestCancel">Cancel</button>
          <button
            type="button"
            class="edit-button"
            :disabled="!isFormValid || isSubmitting"
            @click="handleSubmit"
          >
            {{ isSubmitting ? 'Creating...' : 'Create MPA' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmModal
    :open="confirmOpen"
    title="Discard changes?"
    message="You have started creating an MPA. Discard your changes?"
    confirm-label="Discard"
    cancel-label="Keep editing"
    @confirm="confirmCancel"
    @cancel="confirmOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { z } from 'zod';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useForm } from '@/composables/useForm';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';
import InputTextField from '@/components/ui/fields/InputTextField.vue';
import DropdownField from '@/components/ui/fields/DropdownField.vue';
import FileUploadField from '@/components/ui/fields/FileUploadField.vue';
import type { EditFieldComponent } from '@/types/edit';
import { useOptionsStore, type ProvinceApiResponse, type MunicipalityApiResponse, type BarangayApiResponse } from '@/stores/options';
import { useProvinceOptions, useMunicipalityOptions, useBarangayOptions } from '@/composables/useDropdownOptions';
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import { uploadShapefile } from '@/api/mpa';

const emit = defineEmits<{
  submit: [data: Record<string, unknown>];
  close: [];
}>();

const isOpen = ref(false);
const activeTab = ref(0);
const optionsStore = useOptionsStore();
const authStore = useAuthStore();
const usersStore = useUsersStore();

const isAdmin = computed(() => authStore.user?.user_type === 1);

// Get raw options from store
const provinces = computed(() => (optionsStore.options.provinces || []) as ProvinceApiResponse[]);
const municipalities = computed(() => (optionsStore.options.municipalities || []) as MunicipalityApiResponse[]);
const barangays = computed(() => (optionsStore.options.barangays || []) as BarangayApiResponse[]);

// Transform to dropdown options (this one doesn't depend on payload)
const provinceOptions = useProvinceOptions(provinces);

const formTabs = [
  { label: 'Basic Information', icon: ['fas', 'book-open'] },
  { label: 'More Info', icon: ['fas', 'circle-info'] }
];

// Type options for MPA (Ecosystem types)
const typeOptions = [
  { value: 1, label: 'Corals' },
  { value: 2, label: 'Mangrove' },
  { value: 3, label: 'Seagrass' },
  { value: 4, label: 'Sandy Bottom' },
  { value: 5, label: 'Deep Water' },
  { value: 6, label: 'Island' },
  { value: 7, label: 'Islet' },
  { value: 8, label: 'Wetland' },
  { value: 9, label: 'Beach Forest' },
  { value: 10, label: 'Seaweeds' }
];

type FormFieldDef = {
  key: string;
  component: EditFieldComponent;
  props?: Record<string, unknown> | ((payload: Record<string, unknown>) => Record<string, unknown>);
  fullWidth?: boolean;
};

type FormSectionDef = {
  title: string;
  fields: FormFieldDef[];
};

type OrdinanceEntry = {
  link: string;
  name: string;
};

const componentRegistry = {
  InputTextField,
  DropdownField,
  FileUploadField
};

const resolveComponent = (name: EditFieldComponent) => {
  if (name === 'SwitchField') return InputTextField; // Fallback
  return componentRegistry[name];
};

const resolveFieldProps = (field: FormFieldDef) => {
  const baseProps = typeof field.props === 'function' ? field.props(payload.value as Record<string, unknown>) : field.props ?? {};

  // Unwrap any computed refs in props (like municipalityOptions which is a computed ref)
  const unwrappedProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(baseProps)) {
    // Check if it's a computed ref and unwrap it
    if (value && typeof value === 'object' && 'value' in value) {
      unwrappedProps[key] = (value as { value: unknown }).value;
    } else {
      unwrappedProps[key] = value;
    }
  }

  const error = (errors.value as Record<string, unknown>)[field.key] as string | undefined;
  return { ...unwrappedProps, error, id: field.key, name: field.key };
};

const formSections: FormSectionDef[] = [
  {
    title: 'File Upload',
    fields: [
      {
        key: 'file',
        component: 'FileUploadField',
        fullWidth: true,
        props: {
          placeholder: 'Choose file (.zip, .geojson, .json)',
          accept: '.zip,.geojson,.json,application/zip,application/json',
          multiple: false
        }
      }
    ]
  },
  {
    title: 'Basic Information',
    fields: [
      { key: 'complete_name', component: 'InputTextField', props: { label: 'MPA Name', placeholder: 'Enter MPA name', autocomplete: 'organization' } },
      { key: 'year_established', component: 'InputTextField', props: { label: 'Year Established', placeholder: 'e.g., 2006', type: 'number', autocomplete: 'off' } },
      { key: 'date_established', component: 'InputTextField', props: { label: 'Date Established', placeholder: 'YYYY-MM-DD', type: 'date', autocomplete: 'off' } },
      { key: 'type', component: 'DropdownField', props: { label: 'Type', placeholder: 'Select type', options: typeOptions } }
    ]
  },
  {
    title: 'Location',
    fields: [
      {
        key: 'province',
        component: 'DropdownField',
        props: { label: 'Province', placeholder: 'Select province', options: provinceOptions }
      },
      {
        key: 'municipality',
        component: 'DropdownField',
        props: (values) => ({
          label: 'Municipality',
          placeholder: 'Select municipality',
          options: municipalityOptions,
          disabled: !values.province
        })
      },
      {
        key: 'barangay',
        component: 'DropdownField',
        props: (values) => ({
          label: 'Barangay',
          placeholder: 'Select barangay',
          options: barangayOptions,
          disabled: !values.municipality
        })
      }
    ]
  },
  {
    title: 'Area Information',
    fields: [
      { key: 'core_area', component: 'InputTextField', props: { label: 'Core Area (Ha)', placeholder: 'Enter core area', type: 'number', autocomplete: 'off' } },
      { key: 'buffer_area', component: 'InputTextField', props: { label: 'Buffer Area (Ha)', placeholder: 'Enter buffer area', type: 'number', autocomplete: 'off' } },
      { key: 'total_area', component: 'InputTextField', props: { label: 'Total Area (Ha)', placeholder: 'Enter total area', type: 'number', autocomplete: 'off' } }
    ]
  },
  {
    title: 'Coordinates',
    fields: [
      { key: 'latitude', component: 'InputTextField', props: { label: 'Latitude', placeholder: 'e.g., 15.7582', type: 'number', step: '0.0001', autocomplete: 'off' } },
      { key: 'longitude', component: 'InputTextField', props: { label: 'Longitude', placeholder: 'e.g., 121.625', type: 'number', step: '0.0001', autocomplete: 'off' } }
    ]
  },
  {
    title: 'Management & Planning',
    fields: [
      { key: 'mgt_body', component: 'InputTextField', props: { label: 'Management Body', placeholder: 'Enter management body', autocomplete: 'off' } },
      { key: 'mpa_plan', component: 'InputTextField', props: { label: 'MPA Plan', placeholder: 'Enter MPA plan', autocomplete: 'off' } },
      { key: 'network', component: 'InputTextField', props: { label: 'Network', placeholder: 'Enter network', autocomplete: 'off' } }
    ]
  },
  {
    title: 'Remarks',
    fields: [
      { key: 'remarks', component: 'InputTextField', fullWidth: true, props: { label: 'Remarks', placeholder: 'Enter remarks', autocomplete: 'off' } }
    ]
  }
];

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().optional()
);

const schema = z
  .object({
    file: z.array(z.instanceof(File)).min(1, { message: 'File is required' }),
    complete_name: z.string().min(1, { message: 'MPA Name is required' }),
    year_established: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? undefined : value),
      z.coerce.number().optional()
    ),
    date_established: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? undefined : value),
      z.string().optional()
    ),
    type: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? undefined : value),
      z.coerce.number().int().min(1).max(10).optional()
    ),
    status: z.string().optional().default('FOR VALIDATION'),
    province: z.string().optional(),
    municipality: z.string().optional(),
    barangay: z.string().optional(),
    core_area: optionalNumber,
    buffer_area: optionalNumber,
    total_area: optionalNumber,
    longitude: optionalNumber,
    latitude: optionalNumber,
    remarks: z.string().optional(),
    mgt_body: z.string().optional(),
    mpa_plan: z.string().optional(),
    network: z.string().optional(),
    ordinance_link: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.string().url({ message: 'Must be a valid URL' }).optional()
    ),
    ordinance_name: z.string().optional(),
    uploaded_by: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.coerce.number().optional()
    )
  })
  .refine(
    (data) => {
      // At least one of year_established or date_established must be provided
      return data.year_established !== undefined || data.date_established !== undefined;
    },
    {
      message: 'Either Year Established or Date Established is required',
      path: ['year_established']
    }
  )
  .refine(
    (data) => {
      if (data.date_established) {
        const yearFromDate = new Date(data.date_established).getFullYear();
        return data.year_established === yearFromDate;
      }
      return true;
    },
    {
      message: 'Year Established must match the year from Date Established',
      path: ['year_established']
    }
  )
  .refine(
    (data) => {
      if (data.year_established !== undefined) {
        const currentYear = new Date().getFullYear();
        return data.year_established <= currentYear;
      }
      return true;
    },
    {
      message: 'Year Established cannot be in the future',
      path: ['year_established']
    }
  )
  .refine(
    (data) => {
      if (data.date_established) {
        const selectedDate = new Date(data.date_established);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        return selectedDate <= today;
      }
      return true;
    },
    {
      message: 'Date Established cannot be in the future',
      path: ['date_established']
    }
  );

const initialValues = {
  file: [] as File[],
  complete_name: '',
  year_established: '',
  date_established: '',
  type: '',
  status: 'FOR VALIDATION',
  province: '',
  municipality: '',
  barangay: '',
  core_area: '',
  buffer_area: '',
  total_area: '',
  longitude: '',
  latitude: '',
  remarks: '',
  mgt_body: '',
  mpa_plan: '',
  network: '',
  ordinance_link: '',
  ordinance_name: '',
  uploaded_by: ''
};

const { payload, errors, validateForm, resetForm, isFormValid, isSubmitting } = useForm(
  schema,
  initialValues
);

// Pre-compute filtered municipality and barangay options (performance optimization)
// These depend on payload so must be defined AFTER useForm
const municipalityOptions = computed(() => {
  const provinceName = payload.value.province;
  if (!provinceName) return [];
  const province = provinces.value.find(p => p.name === provinceName);
  const opts = useMunicipalityOptions(municipalities, province?.id);
  return opts.value;
});

const barangayOptions = computed(() => {
  const municipalityName = payload.value.municipality;
  if (!municipalityName) return [];
  const municipality = municipalities.value.find(m => m.name === municipalityName);
  const opts = useBarangayOptions(barangays, municipality?.id);
  return opts.value;
});

const userOptions = computed(() =>
  usersStore.list.map((u) => ({
    value: u.id ?? u.user_id,
    label: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email
  }))
);

const ordinanceEntries = ref<OrdinanceEntry[]>([{ link: '', name: '' }]);
const ordinanceErrors = ref<Record<number, string>>({});

const moreInfoSections = computed((): FormSectionDef[] => {
  const sections: FormSectionDef[] = [];
  if (isAdmin.value) {
    sections.push({
      title: 'Administrative',
      fields: [
        {
          key: 'uploaded_by',
          component: 'DropdownField',
          props: () => ({ label: 'Uploaded By', placeholder: 'Select user', options: userOptions.value })
        }
      ]
    });
  }
  return sections;
});

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const addOrdinanceEntry = () => {
  ordinanceEntries.value.push({ link: '', name: '' });
};

const removeOrdinanceEntry = (index: number) => {
  ordinanceEntries.value.splice(index, 1);
  if (ordinanceEntries.value.length === 0) {
    ordinanceEntries.value.push({ link: '', name: '' });
  }
  const nextErrors: Record<number, string> = {};
  ordinanceEntries.value.forEach((_, i) => {
    if (ordinanceErrors.value[i]) nextErrors[i] = ordinanceErrors.value[i];
  });
  ordinanceErrors.value = nextErrors;
};

const validateOrdinanceEntries = (): boolean => {
  const nextErrors: Record<number, string> = {};
  ordinanceEntries.value.forEach((entry, index) => {
    const link = entry.link.trim();
    const name = entry.name.trim();
    if (!link && !name) return;
    if (!link && name) {
      nextErrors[index] = 'Ordinance link is required when name is provided';
      return;
    }
    if (link && !isValidUrl(link)) {
      nextErrors[index] = 'Must be a valid URL';
    }
  });
  ordinanceErrors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
};

// Auto-populate year_established from date_established
watch(
  () => payload.value.date_established,
  (newDate) => {
    if (newDate && typeof newDate === 'string' && newDate.trim() !== '') {
      const year = new Date(newDate).getFullYear();
      if (!isNaN(year)) {
        payload.value.year_established = String(year);
      }
    }
  }
);

const confirmOpen = ref(false);

const isDirty = computed(() => {
  const values = payload.value as Record<string, unknown>;
  return Object.keys(values).some((key) => {
    const value = values[key];
    if (typeof value === 'boolean') return value;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  });
});

const open = async () => {
  // Load options and users before opening modal
  await Promise.all([
    (!optionsStore.options.provinces || optionsStore.options.provinces.length === 0)
      ? optionsStore.fetchOptions()
      : Promise.resolve(),
    usersStore.list.length === 0 ? usersStore.fetchAll().catch(() => {}) : Promise.resolve()
  ]);
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  emit('close');
};

const handleSubmit = async () => {
  if (!validateForm() || isSubmitting.value) return;
  if (!validateOrdinanceEntries()) return;

  const files = payload.value.file as File[];
  if (!files || files.length === 0) {
    return;
  }

  const file = files[0]!; // Use the first file (checked above, will exist)

  try {
    isSubmitting.value = true;

    // Extract form data (excluding the file) and filter out empty/invalid values
    const formDataWithoutFile: Record<string, unknown> = Object.fromEntries(
      Object.entries(payload.value)
        .filter(([key]) => key !== 'file')
        .filter(([key]) => key !== 'ordinance_link' && key !== 'ordinance_name')
        .filter(([, value]) => {
          // Filter out empty strings, null, undefined, and NaN
          if (value === '' || value === null || value === undefined) return false;
          if (typeof value === 'number' && Number.isNaN(value)) return false;
          return true;
        })
    );

    const ordinances = ordinanceEntries.value
      .map((entry) => ({ link: entry.link.trim(), name: entry.name.trim() }))
      .filter((entry) => entry.link.length > 0);

    const firstOrdinance = ordinances[0];
    if (firstOrdinance) {
      formDataWithoutFile.ordinance_link = firstOrdinance.link;
      if (firstOrdinance.name) {
        formDataWithoutFile.ordinance_name = firstOrdinance.name;
      }
      formDataWithoutFile.ordinances = ordinances;
    }

    // Default uploaded_by to current user if not provided
    if (!formDataWithoutFile.uploaded_by && authStore.user) {
      formDataWithoutFile.uploaded_by = authStore.user.id ?? authStore.user.user_id;
    }

    // Call the upload API
    const response = await uploadShapefile(file, formDataWithoutFile);

    if (response.data.success) {
      emit('submit', response.data);
      resetForm();
      ordinanceEntries.value = [{ link: '', name: '' }];
      ordinanceErrors.value = {};
      close();
    } else {
      console.error('Upload failed:', response.data.error);
      // TODO: Show user-facing error message
    }
  } catch (error: unknown) {
    console.error('Upload error:', error);
    // TODO: Show user-facing error message
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  resetForm();
  ordinanceEntries.value = [{ link: '', name: '' }];
  ordinanceErrors.value = {};
  activeTab.value = 0;
  close();
};

const requestCancel = () => {
  if (isDirty.value) {
    confirmOpen.value = true;
    return;
  }
  handleCancel();
};

const confirmCancel = () => {
  confirmOpen.value = false;
  handleCancel();
};

defineExpose({
  open,
  close
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  max-width: 1200px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.details-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.75rem 2rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background-color: #ffffff;
  z-index: 2;
}

.details-title {
  font-size: 2rem;
  font-weight: bold;
  flex: 1;
  min-width: 200px;
}

.details-body--tabbed {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.form-tab-sidebar {
  width: 190px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0 1.5rem 1.5rem;
  border-right: 1px solid #e5e7eb;
  align-self: stretch;
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

.form-tab-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  display: grid;
  gap: 1.5rem;
  align-content: start;
}

.details-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  align-items: center;
  padding: 1.25rem 2rem 1.75rem;
  border-top: 1px solid #e5e7eb;
  position: sticky;
  bottom: 0;
  background-color: #ffffff;
  z-index: 2;
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
  border: none;
  cursor: pointer;
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

.ordinance-group {
  display: grid;
  gap: 1rem;
}

.ordinance-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: end;
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

.ordinance-remove {
  justify-self: flex-start;
  align-self: end;
  margin-bottom: 0.35rem;
}

.ordinance-add-button {
  border: none;
  background: transparent;
  color: #1f2937;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-self: center;
}

.ordinance-add-button:hover {
  color: #111827;
}

@media (max-width: 900px) {
  .ordinance-row {
    grid-template-columns: 1fr;
  }
}
</style>
