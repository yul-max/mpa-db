<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="requestCancel">
    <div class="modal-content">
      <div class="details-content">
        <div class="details-header">
          <h1 class="details-title">Create User</h1>
        </div>

        <div class="details-body">
          <form class="details-grid" @submit.prevent="handleSubmit">
            <div class="detail-section">
              <h2>Account Information</h2>
              <div class="detail-group">
                <div class="detail-item">
                  <InputTextField
                    v-model="payload.user_name"
                    label="Username"
                    placeholder="Enter username"
                    :error="errors.user_name"
                  />
                </div>
                <div class="detail-item">
                  <InputTextField
                    v-model="payload.email"
                    label="Email"
                    placeholder="Enter email"
                    type="email"
                    :error="errors.email"
                  />
                </div>
                <div class="detail-item">
                  <InputTextField
                    v-model="payload.first_name"
                    label="First Name"
                    placeholder="Enter first name"
                    :error="errors.first_name"
                  />
                </div>
                <div class="detail-item">
                  <InputTextField
                    v-model="payload.last_name"
                    label="Last Name"
                    placeholder="Enter last name"
                    :error="errors.last_name"
                  />
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h2>Location</h2>
              <div class="detail-group">
                <div class="detail-item">
                  <InputTextField
                    v-model="payload.province"
                    label="Province"
                    placeholder="Enter province"
                    :error="errors.province"
                  />
                </div>
                <div class="detail-item">
                  <InputTextField
                    v-model="payload.municipality"
                    label="Municipality"
                    placeholder="Enter municipality"
                    :error="errors.municipality"
                  />
                </div>
                <div class="detail-item">
                  <InputTextField
                    v-model="payload.barangay"
                    label="Barangay"
                    placeholder="Enter barangay"
                    :error="errors.barangay"
                  />
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h2>Account Type</h2>
              <div class="detail-group">
                <div class="detail-item">
                  <InputTextField
                    v-model="payload.user_type"
                    label="User Type"
                    placeholder="Enter user type"
                    type="number"
                    :error="errors.user_type"
                  />
                </div>
              </div>
            </div>
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
            {{ isSubmitting ? 'Creating...' : 'Create User' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmModal
    :open="confirmOpen"
    title="Discard changes?"
    message="You have started creating a user. Discard your changes?"
    confirm-label="Discard"
    cancel-label="Keep editing"
    @confirm="confirmCancel"
    @cancel="confirmOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { z } from 'zod';
import { useForm } from '@/composables/useForm';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';
import InputTextField from '@/components/ui/fields/InputTextField.vue';

const emit = defineEmits<{
  submit: [data: Record<string, unknown>];
  close: [];
}>();

const isOpen = ref(false);

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().optional()
);

const schema = z.object({
  user_name: z.string().optional(),
  email: z.string().email('Valid email required').optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  province: z.string().optional(),
  municipality: z.string().optional(),
  barangay: z.string().optional(),
  user_type: optionalNumber
});

const initialValues = {
  user_name: '',
  email: '',
  first_name: '',
  last_name: '',
  province: '',
  municipality: '',
  barangay: '',
  user_type: ''
};

const { payload, errors, validateForm, resetForm, isFormValid, isSubmitting } = useForm(
  schema,
  initialValues
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

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  emit('close');
};

const handleSubmit = async () => {
  if (!validateForm() || isSubmitting.value) return;
  try {
    isSubmitting.value = true;
    emit('submit', { ...payload.value });
    resetForm();
    close();
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  resetForm();
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
  max-width: 1000px;
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
  min-width: 200px;
}

.details-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
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
</style>
