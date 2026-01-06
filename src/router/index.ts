import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';


const routes = [
  { path: '/login', name: 'login', component: () => import('@/components/auth/LoginForm.vue'), meta: { public: true } },
  { path: '/signup', name: 'signup', component: () => import('@/components/auth/SignupForm.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('@/components/mpa/MapDashboard.vue'), meta: { public: true } },
      { path: 'mpas', name: 'mpas-list', component: () => import('@/pages/MPAs/Index.vue') },
      { path: 'mpas/new', name: 'mpas-new', component: () => import('@/pages/MPAs/New.vue') },
      { path: 'mpas/:id', name: 'mpas-details', component: () => import('@/pages/MPAs/Details.vue') },
      { path: 'mpas/:id/edit', name: 'mpas-edit', component: () => import('@/pages/MPAs/Edit.vue') },
      { path: 'users', name: 'users-list', component: () => import('@/pages/Users/Index.vue') },
      { path: 'users/new', name: 'users-new', component: () => import('@/pages/Users/New.vue') },
      { path: 'users/:id', name: 'users-details', component: () => import('@/pages/Users/Details.vue') },
      { path: 'users/:id/edit', name: 'users-edit', component: () => import('@/pages/Users/Edit.vue') }
    ]
  }
];


const router = createRouter({ history: createWebHistory(), routes });


router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' };
});


export default router;
