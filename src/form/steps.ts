export const formSteps = {
  mpa: { create: [{ title: 'Basic', fields: ['name', 'province', 'municipality'] }, { title: 'Protection', fields: ['isProtected'] }, { title: 'Files', fields: ['files'] }], edit: [{ title: 'Basic', fields: ['name', 'province', 'municipality'] }, { title: 'Protection', fields: ['isProtected'] }] },
  user: { create: [{ title: 'User', fields: ['email', 'role'] }], edit: [{ title: 'User', fields: ['email', 'role'] }] }
};
