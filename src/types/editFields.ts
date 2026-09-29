export type EditFieldComponent = 'InputTextField' | 'DropdownField' | 'SearchSelectField' | 'MultiSelectField' | 'SwitchField' | 'FileUploadField';

export interface EditFieldDef {
  key: string;
  component: EditFieldComponent;
  props?: Record<string, unknown> | ((payload: Record<string, unknown>) => Record<string, unknown>);
}
