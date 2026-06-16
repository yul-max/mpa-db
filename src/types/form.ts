/** Remote source descriptor for dynamically loaded form options. */
export type FieldSource = {
  url: string;
  callback?: (data: any) => any;
}

/** Legacy/config-driven field descriptor used by dynamic form builders. */
export type FormField = {
  name: string;
  type: string;
  label?: string;
  props?: Record<string, any>;
  data?: any[];
  source?: FieldSource;
  hidden?: boolean | ((form: any) => boolean);
}

/**
 * Core field contract used by `Form.vue`.
 * The `type` maps to concrete wrapper components under `src/components/ui/fields`.
 */
export type FieldDef = {
  name: string;
  label?: string;
  type?: 'text' | 'password' | 'select' | 'checkbox' | 'switch' | 'file';
  component?: unknown; // optional override component
  options?: (string | { value?: string | number; label?: string;[key: string]: any })[];
  placeholder?: string;
  props?: Record<string, unknown>;
  disabled?: boolean | ((payload: Record<string, any>) => boolean);
  validateOnBlur?: boolean;
  validateOnInput?: boolean;
};

/** Async submit contract consumed by reusable form components. */
export type SubmitFunction<T extends Record<string, any> = Record<string, any>> = (values: T) => Promise<{ success: boolean; message?: string }>;
/** Optional callback invoked by forms after a successful submit. */
export type OnSuccessCallback = () => void | Promise<void>;

