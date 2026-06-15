import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';


const routes = [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('@/components/mpa/MapDashboard.vue'), meta: { public: true } },
      { path: 'mpa', name: 'mpas-list', component: () => import('@/pages/MPAs/Index.vue') },
      { path: 'mpa/new', name: 'mpas-new', component: () => import('@/pages/MPAs/New.vue') },
      { path: 'mpa/:id', name: 'mpas-details', component: () => import('@/pages/MPAs/Details.vue') },
      { path: 'mpa/:id/edit', name: 'mpas-edit', component: () => import('@/pages/MPAs/Edit.vue') },
      { path: 'mpa/pending/:id', name: 'mpas-pending-details', component: () => import('@/pages/MPAs/Details.vue'), meta: { pending: true } },
      { path: 'users', name: 'users-list', component: () => import('@/pages/Users/Index.vue'), meta: { requiresAuth: true } },
      { path: 'users/new', name: 'users-new', component: () => import('@/pages/Users/New.vue'), meta: { requiresAuth: true } },
      { path: 'users/:id', name: 'users-details', component: () => import('@/pages/Users/Details.vue'), meta: { requiresAuth: true } },
      { path: 'users/:id/edit', name: 'users-edit', component: () => import('@/pages/Users/Edit.vue'), meta: { requiresAuth: true } },
      { path: 'records', redirect: '/mpa' }
    ]
  }
];


const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && (!auth.user || !auth.isAuthenticated)) {
    return { name: 'dashboard' };
  }
});

export default router;
