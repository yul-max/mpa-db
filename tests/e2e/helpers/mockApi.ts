import type { Page } from 'playwright';

type MockRole = 'admin' | 'reviewer' | 'guest';

interface MockOptions {
  authenticated?: boolean;
  role?: MockRole;
}

const users = [
  {
    id: 1,
    user_id: 1,
    first_name: 'Ada',
    last_name: 'Admin',
    email: 'ada.admin@example.com',
    province: 'Cebu',
    municipality: 'Cebu City',
    user_type: 1
  },
  {
    id: 2,
    user_id: 2,
    first_name: 'Rina',
    last_name: 'Reviewer',
    email: 'rina.reviewer@example.com',
    province: 'Bohol',
    municipality: 'Tagbilaran',
    user_type: 2
  }
];

const approvedRows = [
  {
    id: 11,
    complete_name: 'Apo Reef MPA',
    type: 1,
    status: 'APPROVED',
    province: 'Cebu',
    municipality: 'Oslob',
    barangay: 'Tan-awan',
    total_area: 1200,
    core_area: 500,
    buffer_area: 700,
    latitude: 9.5,
    longitude: 123.3,
    uploaded_by: 1,
    approved_by: 1,
    approved_at: '2024-07-01',
    ordinances: [
      { id: 1, name: 'Municipal Ordinance 001', link: 'https://mandaragat.org/ordinance-1.pdf', year: 2022, type: 1 }
    ]
  },
  {
    id: 12,
    complete_name: 'Balicasag MPA',
    type: 2,
    status: 'APPROVED',
    province: 'Bohol',
    municipality: 'Panglao',
    barangay: 'Doljo',
    total_area: 800,
    core_area: 300,
    buffer_area: 500,
    latitude: 9.6,
    longitude: 123.8,
    uploaded_by: 2,
    approved_by: 1,
    approved_at: '2024-06-15',
    ordinances: []
  }
];

const pendingRows = [
  {
    staging_id: 101,
    id: 101,
    complete_name: 'Pending Sanctuary',
    upload_status: 'pending',
    type: 3,
    province: 'Cebu',
    municipality: 'Moalboal',
    barangay: 'Basdiot',
    year_established: 2023,
    date_established: '2023-05-04',
    total_area: 210,
    core_area: 110,
    buffer_area: 100,
    latitude: 9.91,
    longitude: 123.41,
    uploaded_by: 2,
    ordinances: [
      { id: 51, name: 'Pending Ord 1', link: 'https://mandaragat.org/pending-ord-1.pdf', year: 2023, type: 1 }
    ]
  }
];

const provinces = [
  { id: 7, name: 'Cebu', psgc_code: '072200000' },
  { id: 12, name: 'Bohol', psgc_code: '071200000' }
];

const municipalities = [
  { id: 701, name: 'Oslob', province_id: 7, psgc_code: '072227000' },
  { id: 702, name: 'Moalboal', province_id: 7, psgc_code: '072235000' },
  { id: 1201, name: 'Panglao', province_id: 12, psgc_code: '071233000' }
];

const barangays = [
  { id: 1, name: 'Tan-awan', municipality_id: 701, psgc_code: '072227010' },
  { id: 2, name: 'Basdiot', municipality_id: 702, psgc_code: '072235005' },
  { id: 3, name: 'Doljo', municipality_id: 1201, psgc_code: '071233001' }
];

function pickUser(role: MockRole) {
  if (role === 'reviewer') return users[1];
  if (role === 'guest') return null;
  return users[0];
}

export async function setupApiMocks(page: Page, options: MockOptions = {}) {
  const authenticated = options.authenticated ?? false;
  const role = options.role ?? 'admin';
  const user = pickUser(role);

  await page.route('**/*', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const { pathname } = url;

    const json = async (status: number, body: unknown) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body)
      });
    };

    if (pathname.endsWith('/auth/login') && method === 'POST') {
      await json(200, {
        success: true,
        message: 'Signed in successfully',
        auth_token: 'mock-token-123',
        user: users[0]
      });
      return;
    }

    if (pathname.endsWith('/me') && method === 'GET') {
      if (!authenticated || !user) {
        await json(401, { error: 'Unauthorized' });
        return;
      }
      await json(200, user);
      return;
    }

    if (pathname.endsWith('/users') && method === 'GET') {
      await json(200, { rows: users, count: users.length });
      return;
    }

    if (/\/users\/\d+$/.test(pathname) && method === 'GET') {
      const id = Number(pathname.split('/').pop());
      const found = users.find((u) => (u.id === id || u.user_id === id));
      await json(200, found ?? users[0]);
      return;
    }

    if (pathname.endsWith('/datalist') && method === 'GET') {
      await json(200, { rows: approvedRows, count: approvedRows.length });
      return;
    }

    if (/\/datalist\/single\/\d+$/.test(pathname) && method === 'GET') {
      const id = Number(pathname.split('/').pop());
      const row = approvedRows.find((item) => item.id === id) ?? approvedRows[0];
      await json(200, row);
      return;
    }

    if (/\/ordinance\/\d+$/.test(pathname) && method === 'GET') {
      await json(200, [
        { id: 11, mpa_id: 11, year: 2024, val: 'Municipal Ord. 2024-01', type: 1, attach: 'https://mandaragat.org/ord-2024.pdf' }
      ]);
      return;
    }

    if (pathname.endsWith('/provinces') && method === 'GET') {
      await json(200, provinces);
      return;
    }

    if (pathname.endsWith('/municipalities') && method === 'GET') {
      await json(200, municipalities);
      return;
    }

    if (pathname.endsWith('/barangays') && method === 'GET') {
      await json(200, barangays);
      return;
    }

    if (pathname.endsWith('/upload/my-mpas') && method === 'GET') {
      await json(200, {
        success: true,
        staging: pendingRows,
        approved: approvedRows
      });
      return;
    }

    if (pathname.endsWith('/upload/queue') && method === 'GET') {
      await json(200, {
        success: true,
        count: pendingRows.length,
        data: pendingRows
      });
      return;
    }

    if (/\/upload\/queue\/\d+$/.test(pathname) && method === 'GET') {
      await json(200, {
        success: true,
        data: pendingRows[0]
      });
      return;
    }

    if (/\/upload\/approve\/\d+$/.test(pathname) && method === 'PUT') {
      await json(200, {
        success: true,
        new_mpa_id: 201,
        features_published: 1
      });
      return;
    }

    if (/\/upload\/reject\/\d+$/.test(pathname) && method === 'PUT') {
      await json(200, {
        success: true,
        message: 'Rejected'
      });
      return;
    }

    if (pathname.endsWith('/upload/shapefile') && method === 'POST') {
      await json(200, {
        success: true,
        message: 'MPA upload successful'
      });
      return;
    }

    await route.continue();
  });
}

export async function setAuthCookies(page: Page, role: MockRole = 'admin') {
  const user = pickUser(role);
  if (!user) return;

  await page.context().addCookies([
    {
      name: 'auth_token',
      value: 'mock-token-123',
      domain: '127.0.0.1',
      path: '/'
    },
    {
      name: 'auth_user',
      value: JSON.stringify(user),
      domain: '127.0.0.1',
      path: '/'
    }
  ]);
}
