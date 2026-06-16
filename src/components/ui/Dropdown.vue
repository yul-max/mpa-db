<template>
  <div ref="dropdownRef" class="dropdown-container">
    <button
      class="dropdown-button"
      :class="{ 'dropdown-open': isOpen }"
      @click="toggleDropdown"
    >
      <FontAwesomeIcon :icon="['fas', icon]" class="dropdown-icon" />
      <span>{{ title }}</span>
      <FontAwesomeIcon
        :icon="['fas', isOpen ? 'chevron-up' : 'chevron-down']"
        class="chevron-icon"
      />
    </button>

    <div v-if="isOpen" class="dropdown-menu">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="dropdown-item"
        @click="handleItemClick(item)"
      >
        <FontAwesomeIcon
          v-if="item.icon"
          :icon="['fas', item.icon]"
          class="item-icon"
        />
        <span>{{ item.title }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { DropdownItem } from '@/types/ui';

interface Props {
  icon: string;
  title: string;
  items: DropdownItem[];
}

defineProps<Props>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node | null;
  if (!target || !dropdownRef.value) return;
  if (!dropdownRef.value.contains(target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleItemClick = async (item: DropdownItem) => {
  await item.handler();
  isOpen.value = false;
};
</script>

<style scoped>
.dropdown-container {
  position: relative;
  display: inline-block;
}

.dropdown-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  color: #1f2937;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  min-width: 180px;
}

.dropdown-button:hover {
  background-color: #ffffff;
  border-color: #2563eb;
  color: #2563eb;
}

.dropdown-button.dropdown-open {
  border-color: #2563eb;
  color: #2563eb;
  background-color: #ffffff;
}

.dropdown-button.dropdown-open:hover {
  border-color: #2563eb;
  color: #2563eb;
  background-color: #ffffff;
}

.dropdown-icon {
  font-size: 1rem;
}

.chevron-icon {
  font-size: 0.75rem;
  margin-left: auto;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 180px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f9fafb;
}

.item-icon {
  font-size: 0.875rem;
  color: #6b7280;
  flex-shrink: 0;
}
</style>
