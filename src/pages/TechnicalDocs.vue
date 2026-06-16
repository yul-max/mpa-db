<template>
  <div class="technical-docs-page">
    <section class="docs-hero">
      <h1>Technical Documentation</h1>
      <p>
        Developer-facing reference for architecture, component contracts, typing, theming,
        state, routing, scripts, and test execution.
      </p>
      <div class="hero-links">
        <a href="/docs/COMPONENTS.md" target="_blank" rel="noopener noreferrer">Components Overview</a>
        <a href="/docs/components/README.md" target="_blank" rel="noopener noreferrer">Component Docs Index</a>
      </div>
    </section>

    <section>
      <h2>System Architecture</h2>
      <ul>
        <li><strong>Framework:</strong> Vue 3 + TypeScript + Vite.</li>
        <li><strong>Layout:</strong> App shell is composed in <code>AppLayout.vue</code> with route-level views.</li>
        <li><strong>Feature modules:</strong> MPA, Users, Auth, and shared UI primitives.</li>
        <li><strong>Data flow:</strong> Components call API modules and normalize data in Pinia stores.</li>
      </ul>
    </section>

    <section>
      <h2>Component Functionalities and Limitations</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Functionality</th>
              <th>Known Limitation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in componentCapabilities" :key="item.name">
              <td><code>{{ item.name }}</code></td>
              <td>{{ item.functionality }}</td>
              <td>{{ item.limitation }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Component Props and Specification</h2>
      <p class="section-intro">
        Core reusable UI contracts. For exhaustive feature-level details, see the markdown docs in <code>docs/components</code>.
      </p>
      <div v-for="spec in componentSpecs" :key="spec.component" class="spec-card">
        <h3>{{ spec.component }}</h3>
        <ul>
          <li v-for="entry in spec.props" :key="entry"><code>{{ entry }}</code></li>
        </ul>
      </div>
    </section>

    <section>
      <h2>Type Definitions (TypeScript)</h2>
      <ul>
        <li><code>src/types/form.ts</code>: schema-driven form field and submit contracts.</li>
        <li><code>src/types/ui.ts</code>: shared UI barrel exports for table/context/dropdown types.</li>
        <li><code>src/types/edit.ts</code>: editable details field configuration.</li>
        <li><code>src/types/map.ts</code> and <code>src/types/geoserver.ts</code>: map and geospatial payload typing.</li>
      </ul>
      <p class="limit-note">
        Some stores/components still use permissive object typing in dynamic API paths. Prefer migrating those paths to explicit interfaces when expanding features.
      </p>
    </section>

    <section>
      <h2>Theming (TailwindCSS + PrimeVue)</h2>
      <ul>
        <li>Tailwind is enabled via <code>@tailwindcss/vite</code> and imported from <code>src/styles/main.css</code>.</li>
        <li>PrimeVue theme tokens are overridden in <code>src/styles/main.css</code> using Tailwind theme values.</li>
        <li>PrimeVue preset is configured in <code>src/main.ts</code> (Lara preset, dark mode selector disabled).</li>
      </ul>
    </section>

    <section>
      <h2>State Management (Vue + Pinia)</h2>
      <ul>
        <li><code>auth</code>: login/logout/session verification and cookie restoration.</li>
        <li><code>users</code>: user list caching and CRUD workflows.</li>
        <li><code>mpa</code>: approved/pending MPA loading and detail hydration.</li>
        <li>Additional feature stores exist for map points, options, and drawer state orchestration.</li>
      </ul>
    </section>

    <section>
      <h2>Route Navigation (Vue Router)</h2>
      <ul>
        <li>Base layout route at <code>/</code> with child feature routes for dashboard, MPAs, and users.</li>
        <li>Auth guard blocks routes tagged with <code>meta.requiresAuth</code>.</li>
        <li>This technical docs page is available at <code>/technical-docs</code> and intended for development mode usage.</li>
      </ul>
    </section>

    <section>
      <h2>Development Scripts</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Script</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="script in scripts" :key="script.name">
              <td><code>{{ script.name }}</code></td>
              <td>{{ script.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Running Tests (Playwright)</h2>
      <ul>
        <li><code>npm run test:e2e</code>: full e2e suite.</li>
        <li><code>npm run test:e2e:smoke</code>: critical-path smoke tests.</li>
        <li><code>npm run test:e2e:ui</code>: Playwright UI runner.</li>
        <li><code>npm run test:e2e:full:ci</code> and <code>npm run test:e2e:smoke:ci</code>: CI-optimized variants.</li>
      </ul>
      <p class="limit-note">
        Test stability depends on route-level API mocks and deterministic auth/session setup used in the e2e fixtures.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
type ComponentCapability = {
  name: string;
  functionality: string;
  limitation: string;
};

type ComponentSpec = {
  component: string;
  props: string[];
};

type ScriptInfo = {
  name: string;
  description: string;
};

const componentCapabilities: ComponentCapability[] = [
  {
    name: 'GenericDataTable.vue',
    functionality: 'Shared listing shell with sorting, filtering, pagination, context actions, and CSV export.',
    limitation: 'Assumes consumer supplies normalized column definitions and data shaping.'
  },
  {
    name: 'Form.vue',
    functionality: 'Schema-driven form rendering with validation and submit callbacks.',
    limitation: 'Field typing is dynamic; strongly typed field payloads must be enforced by caller schema.'
  },
  {
    name: 'Details.vue',
    functionality: 'Reusable details page with view/edit mode and optional tab sections.',
    limitation: 'Edit component registry is explicit; new field components must be registered manually.'
  },
  {
    name: 'Dropdown.vue',
    functionality: 'Reusable actions dropdown with async item handlers.',
    limitation: 'Simple click-outside logic is document-level and assumes standard pointer interactions.'
  }
];

const componentSpecs: ComponentSpec[] = [
  {
    component: 'Form.vue',
    props: [
      'schema: z.ZodSchema',
      'initialValues: T',
      'fields?: FieldDef[]',
      'submit?: SubmitFunction',
      'onSuccess?: OnSuccessCallback',
      "buttonAlign?: 'left' | 'right' | 'center'"
    ]
  },
  {
    component: 'GenericDataTable.vue',
    props: [
      'rows: any[]',
      'columns: ColumnDef[]',
      'totalRecords: number',
      'loading: boolean',
      "exportListName?: 'MPA' | 'User'",
      'exportAllRows?: () => Promise<Record<string, unknown>[]>'
    ]
  },
  {
    component: 'Details.vue',
    props: [
      'data: Record<string, any> | null',
      'sections: SectionConfig[]',
      "mode?: 'view' | 'edit'",
      'editFields?: EditFieldDef[]',
      'editModel?: Record<string, any> | null',
      'tabs?: TabConfig[]'
    ]
  },
  {
    component: 'Dropdown.vue',
    props: [
      'icon: string',
      'title: string',
      'items: DropdownItem[]'
    ]
  }
];

const scripts: ScriptInfo[] = [
  { name: 'npm run dev', description: 'Start Vite development server.' },
  { name: 'npm run build', description: 'Type-check then produce a production build.' },
  { name: 'npm run preview', description: 'Serve the production build locally.' },
  { name: 'npm run lint', description: 'Run ESLint with autofix on the project.' },
  { name: 'npm run test:e2e', description: 'Run full Playwright end-to-end test suite.' },
  { name: 'npm run test:e2e:smoke', description: 'Run smoke subset of Playwright tests.' },
  { name: 'npm run test:e2e:full:ci', description: 'Run full e2e suite in CI-friendly mode.' }
];
</script>

<style scoped>
.technical-docs-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.docs-hero {
  background: linear-gradient(120deg, #e0f2fe, #f0f9ff);
  border: 1px solid #bae6fd;
  border-radius: 1rem;
  padding: 1.5rem;
}

.docs-hero h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #0c4a6e;
}

.docs-hero p {
  margin: 0.75rem 0 0;
  color: #334155;
}

.hero-links {
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-links a {
  color: #0c4a6e;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px dashed #0c4a6e;
}

section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
}

h2 {
  margin: 0 0 0.75rem;
  color: #0f172a;
}

h3 {
  margin: 0;
  color: #1e293b;
}

ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #334155;
}

li {
  margin: 0.3rem 0;
}

.section-intro {
  margin: 0 0 1rem;
  color: #475569;
}

.spec-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

th,
td {
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.65rem;
  vertical-align: top;
}

th {
  color: #0f172a;
  font-weight: 700;
  background: #f8fafc;
}

.limit-note {
  margin: 0.75rem 0 0;
  color: #475569;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .technical-docs-page {
    padding: 1rem;
  }
}
</style>
