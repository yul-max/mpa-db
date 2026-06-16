<template>
  <div class="context-submenu" @click.stop>
    <div v-for="(item, index) in items" :key="index" class="submenu-item" @click="toggleItem(index)" :class="{ 'disabled': isOnlyVisible(index) }">
      <input
        type="checkbox"
        :checked="item.toggled ?? false"
        :disabled="isOnlyVisible(index)"
        @click.stop="toggleItem(index)"
        class="submenu-checkbox"
      />
      <span class="submenu-title">{{ item.title }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContextSubMenuAction } from '@/types/ui';

interface Props {
  items: ContextSubMenuAction[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  toggle: [index: number, value: boolean];
}>();

const toggleItem = (index: number) => {
  const item = props.items[index];
  if (!item) return;
  // Check if this is the only visible item
  if (isOnlyVisible(index)) {
    return; // Don't toggle if it's the only visible one
  }
  const newValue = !(item.toggled ?? false);
  emit('toggle', index, newValue);
};

const isOnlyVisible = (index: number): boolean => {
  const item = props.items[index];
  if (!item) return false;
  const visibleCount = props.items.filter((item) => item.toggled !== false).length;
  return visibleCount === 1 && (item.toggled ?? false);
};
</script>

<style scoped>
.context-submenu {
  min-width: 200px;
  padding: 0.25rem 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.submenu-item:hover {
  background-color: #f3f4f6;
}

.submenu-item.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.submenu-item.disabled:hover {
  background-color: transparent;
}

.submenu-checkbox {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.submenu-title {
  flex: 1;
  font-size: 0.875rem;
  color: #333;
}
</style>
