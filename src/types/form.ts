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

// no default export needed for a type
