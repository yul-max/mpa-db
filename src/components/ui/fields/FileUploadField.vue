<template>
  <div class="file-upload-field">
    <label v-if="label" class="field-label">{{ label }}</label>
    <div
      v-if="fileList.length === 0"
      class="file-input-wrapper"
      :class="{ 'dragging': isDragging }"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="file-input"
        v-bind="$attrs"
        @change="handleFileChange"
      />
      <span class="file-input-label" @click="triggerFileInput">
        {{ isDragging ? 'Drop file here' : (placeholder || label || 'Choose file') }}
      </span>
    </div>
    <div v-if="fileList.length > 0" class="file-list">
      <div v-for="(file, index) in fileList" :key="index" class="file-item">
        <span class="file-name">{{ file.name }}</span>
        <button
          type="button"
          class="file-remove"
          @click="removeFile(index)"
          aria-label="Remove file"
        >
          ✕
        </button>
      </div>
    </div>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array as () => File[],
    default: () => []
  },
  label: String,
  placeholder: String,
  accept: String,
  multiple: Boolean,
  error: String
});

const emit = defineEmits<{
  'update:modelValue': [value: File[]];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const fileList = ref<File[]>([...(props.modelValue || [])]);
const isDragging = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const isValidFile = (file: File): boolean => {
  if (!props.accept) return true;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // Parse accept prop to get allowed extensions and MIME types
  const acceptedTypes = props.accept.split(',').map(type => type.trim().toLowerCase());

  // Check if file matches by extension
  const extensionMatch = acceptedTypes.some(type => {
    if (type.startsWith('.')) {
      return fileName.endsWith(type);
    }
    return false;
  });

  // Check if file matches by MIME type
  const mimeMatch = acceptedTypes.some(type => {
    if (!type.startsWith('.')) {
      return fileType === type;
    }
    return false;
  });

  return extensionMatch || mimeMatch;
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const selectedFiles: File[] = input.files ? Array.from(input.files) : [];

  if (selectedFiles.length === 0) return;

  // Filter out invalid file types
  const validFiles = selectedFiles.filter(file => isValidFile(file));

  if (validFiles.length === 0) {
    alert(`Please select only allowed file types: ${props.accept}`);
    // Reset the input
    if (input) input.value = '';
    return;
  }

  if (validFiles.length < selectedFiles.length) {
    alert(`Some files were rejected. Only allowed file types: ${props.accept}`);
  }

  if (!props.multiple) {
    const file = validFiles[0];
    if (file) {
      fileList.value = [file];
      emit('update:modelValue', fileList.value);
    }
  } else {
    if (validFiles.length > 0) {
      fileList.value.push(...validFiles);
      emit('update:modelValue', fileList.value);
    }
  }
};

const removeFile = (index: number) => {
  fileList.value = fileList.value.filter((_, i) => i !== index);
  emit('update:modelValue', fileList.value);
};

const handleDragEnter = () => {
  isDragging.value = true;
};

const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  // Only set to false if leaving the wrapper itself
  const target = event.target as HTMLElement;
  const wrapper = target.closest('.file-input-wrapper');
  if (!wrapper || event.relatedTarget instanceof Node && !wrapper.contains(event.relatedTarget)) {
    isDragging.value = false;
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;

  const droppedFiles: File[] = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];

  if (droppedFiles.length === 0) return;

  // Filter out invalid file types
  const validFiles = droppedFiles.filter(file => isValidFile(file));

  if (validFiles.length === 0) {
    alert(`Please select only allowed file types: ${props.accept}`);
    return;
  }

  if (validFiles.length < droppedFiles.length) {
    alert(`Some files were rejected. Only allowed file types: ${props.accept}`);
  }

  if (!props.multiple) {
    const file = validFiles[0];
    if (file) {
      fileList.value = [file];
      emit('update:modelValue', fileList.value);
    }
  } else {
    if (validFiles.length > 0) {
      fileList.value.push(...validFiles);
      emit('update:modelValue', fileList.value);
    }
  }
};
</script>

<style scoped>
.file-upload-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.375rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.file-input-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.file-input {
  display: none;
}

.file-input-label {
  display: block;
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed #d1d5db;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  color: #6b7280;
}

.file-input-wrapper:hover .file-input-label {
  border-color: #3b82f6;
  background-color: #eff6ff;
  color: #3b82f6;
}

.file-input-wrapper.dragging .file-input-label {
  border-color: #10b981;
  background-color: #d1fae5;
  color: #059669;
  border-width: 2px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.375rem;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.file-name {
  font-size: 0.875rem;
  color: #1f2937;
  word-break: break-word;
}

.file-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  transition: color 0.2s;
  flex-shrink: 0;
}

.file-remove:hover {
  color: #dc2626;
}

.field-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
}
</style>
