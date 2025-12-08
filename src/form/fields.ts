export const formFieldList = [
  { name: 'name', label: 'MPA Name', type: 'text', required: true },
  { name: 'province', label: 'Province', type: 'select', data: ['Cebu', 'Bohol', 'Palawan'] },
  { name: 'municipality', label: 'Municipality', type: 'select', source: { url: '/api/municipalities?province={province}', callback: (resp: any) => resp.items || resp }, hidden: (m: any) => !m.province },
  { name: 'isProtected', label: 'Protected?', type: 'checkbox' },
  { name: 'files', label: 'Supporting Files', type: 'file', props: { multiple: true } },
  { name: 'email', label: 'Email', type: 'text', required: true },
  { name: 'role', label: 'Role', type: 'select', data: ['admin', 'contributor', 'viewer'] }
];
