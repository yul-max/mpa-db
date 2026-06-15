export type FieldSource = {
  url: string;
  callback?: (data: any) => any;
}

export type FormField = {
  name: string;
  type: string;
  label?: string;
  props?: Record<string, any>;
  data?: any[];
  source?: FieldSource;
  hidden?: boolean | ((form: any) => boolean);
}

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

export type SubmitFunction = <T extends Record<string, any>>(values: T) => Promise<{ success: boolean; message?: string }>;
export type OnSuccessCallback = () => void | Promise<void>;

