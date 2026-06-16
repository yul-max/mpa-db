import type { VNodeChild } from 'vue';

export interface ColumnDef {
  field: string;
  header: string;
  sortable?: boolean;
  sort_column?: string;
  filter?: string;
  source?: {
    url?: string;
    data?: Array<{ label: string; value: unknown } | string>;
  };
  show?: boolean;
  locked?: boolean;
  colWidth?: number;
  type?: 'string' | 'number' | 'boolean' | 'array';
  render?: (row: Record<string, any>) => VNodeChild;
  exportValue?: (row: Record<string, any>) => string | number | boolean | null | undefined;
}
