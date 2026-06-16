export const setupFormFields = {
  mpa: { create: ['name', 'province', 'municipality', 'isProtected', 'files'], edit: ['name', 'province', 'municipality', 'isProtected'], view: ['name', 'province', 'municipality', 'isProtected', 'files'] },
  user: { create: ['email', 'role'], edit: ['email', 'role'], view: ['email', 'role'] }
};
