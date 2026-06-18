<template>
  <div class="flex justify-between select-none items-center min-h-12 relative">
    <div class="flex items-center gap-3">
      <img src="@/assets/msnlog.png" alt="MSN Logo" class="h-8" />
      <span class="font-bold">{{ title }}</span>
    </div>
    <div class="flex gap-4 h-10 items-center absolute left-1/2 transform -translate-x-1/2">
      <button
        v-for="button in visibleHeaderButtons"
        :key="button.id"
        :class="[
          'w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer',
          isActiveRoute(button.path)
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        ]"
        @click="button.onClick"
        :title="button.label"
      >
        <FontAwesomeIcon :icon="['fas', button.icon]" />
      </button>
    </div>
    <div class="flex gap-2 h-10 items-center">
      <div class="flex divide-x divide-gray-300 h-10 items-center">
      <span
        v-if="!userLoggedIn"
        class="ml-4 clickable hoverable pr-4"
        @click="onClickLogin()"
      >
        Log In
      </span>
      <component
        v-for="item in visibleComponents"
        :key="item.id"
        :is="item.component"
        v-bind="item.props"
        @click="item.onClick"
      />
      </div>
    </div>
  </div>
  <LoginModal ref="loginModalRef" />
  <UserMenu ref="userMenuRef" />
</template>

<script setup lang="ts">
import { shallowRef, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import LoginModal from '@/components/auth/LoginModal.vue';
import UserMenu from '@/components/auth/UserMenu.vue';
import UserIcon from '@/components/ui/UserIcon.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const title = ref('Philippine MPA Database');
const authStore = useAuthStore();
const loginModalRef = ref<InstanceType<typeof LoginModal> | null>(null);
const userMenuRef = ref<InstanceType<typeof UserMenu> | null>(null);

const userLoggedIn = computed(() => !!authStore.user);

const isActiveRoute = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

/**
 * Header center navigation.
 * Keep IDs stable because tests and route-visibility logic key off these values.
 */
const headerButtons = ref([
  {
    id: 'home',
    label: 'Home',
    icon: 'house',
    path: '/',
    onClick: () => {
      router.push('/');
    }
  },
  {
    id: 'records',
    label: 'MPA',
    icon: 'book-open',
    path: '/mpa',
    onClick: () => {
      router.push('/mpa');
    }
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'users',
    path: '/users',
    onClick: () => {
      router.push('/users');
    }
  },
  {
    id: 'technical-docs',
    label: 'Technical Docs',
    icon: 'circle-info',
    path: '/technical-docs',
    onClick: () => {
      router.push('/technical-docs');
    }
  },
  // {
  //   id: 'add',
  //   label: 'Add',
  //   icon: 'plus',
  //   path: '/add',
  //   onClick: () => {
  //     router.push('/add');
  //   }
  // }
]);

const headerComponents = shallowRef([
  {
    id: 'user-icon',
    component: UserIcon,
    props: {},
    show: () => !!userLoggedIn.value,
    onClick: () => {
      userMenuRef.value?.openMenu();
    }
  }
]);

const visibleComponents = computed(() => headerComponents.value.filter(item => item.show()));

const visibleHeaderButtons = computed(() =>
  headerButtons.value.filter((button) => {
    if (button.id === 'users') return userLoggedIn.value && authStore.user.user_type === 1;
    if (button.id === 'technical-docs') return import.meta.env.DEV;
    return true;
  })
);

const onClickLogin = () => {
  if (loginModalRef.value) {
    loginModalRef.value.openDrawer();
  }
};

</script>

<style scoped>
</style>
