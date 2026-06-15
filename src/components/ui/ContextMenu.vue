<template>
  <div v-if="isOpen" class="context-menu-overlay" @click="close"></div>
  <div :class="['context-menu', { 'menu-open': isOpen }]" :style="menuStyle">
    <template v-for="(item, index) in actions" :key="index">
      <div
        v-if="!item.submenu || item.submenu.length === 0"
        class="menu-item"
        :class="item.color ? `menu-item-${item.color}` : ''"
        @click="handleAction(item)"
      >
        <FontAwesomeIcon :icon="['fas', item.icon]" class="menu-icon" />
        <span class="menu-title">{{ item.title }}</span>
      </div>
      <div
        v-else
        class="menu-item submenu-trigger"
        @click="toggleSubmenu(index)"
      >
        <FontAwesomeIcon :icon="['fas', item.icon]" class="menu-icon" />
        <span class="menu-title">{{ item.title }}</span>
        <FontAwesomeIcon :icon="['fas', 'chevron-right']" class="chevron-icon" />
        <ContextSubMenu
          v-if="item.submenu && item.submenu.length > 0 && openSubmenu === index"
          :items="item.submenu"
          @toggle="(idx, val) => handleSubmenuToggle(index, idx, val)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ContextAction } from '@/types/ui';
import ContextSubMenu from './ContextSubMenu.vue';

interface Props {
  actions: ContextAction[];
  position?: { x: number; y: number };
}

interface Emits {
  (e: 'close'): void;
  (e: 'submenu-toggle', actionIndex: number, itemIndex: number, value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  position: () => ({ x: 0, y: 0 })
});

const emit = defineEmits<Emits>();

const isOpen = ref(true);
const openSubmenu = ref<number | null>(null);

const menuStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`
}));

const handleAction = async (item: ContextAction) => {
  if (item.action) {
    await item.action();
  }
  close();
};

const toggleSubmenu = (index: number) => {
  openSubmenu.value = openSubmenu.value === index ? null : index;
};

const handleSubmenuToggle = (actionIndex: number, itemIndex: number, value: boolean) => {
  emit('submenu-toggle', actionIndex, itemIndex, value);
};

const close = () => {
  isOpen.value = false;
  emit('close');
};

defineExpose({ close });
</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.95);
  transition: all 0.15s ease-out;
}

.context-menu.menu-open {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
  font-size: 0.875rem;
  color: #333;
}

.menu-item:hover {
  background-color: #f3f4f6;
}

.menu-item-green {
  color: #059669;
}

.menu-item-green:hover {
  background-color: #d1fae5;
}

.menu-item-green .menu-icon {
  color: #10b981;
}

.menu-item-red {
  color: #dc2626;
}

.menu-item-red:hover {
  background-color: #fee2e2;
}

.menu-item-red .menu-icon {
  color: #ef4444;
}

.menu-item.submenu-trigger {
  position: relative;
}

.menu-icon {
  width: 16px;
  min-width: 16px;
}

.menu-title {
  flex: 1;
}

.chevron-icon {
  width: 14px;
  min-width: 14px;
  margin-left: 0.5rem;
  color: #999;
}

:deep(.context-submenu) {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 0.25rem;
  min-width: 200px;
  padding: 0.25rem 0;
}
</style>
