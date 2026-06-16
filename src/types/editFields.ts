export type EditFieldComponent = 'InputTextField' | 'DropdownField' | 'SwitchField' | 'FileUploadField';

export interface EditFieldDef {
  key: string;
  component: EditFieldComponent;
  props?: Record<string, unknown> | ((payload: Record<string, unknown>) => Record<string, unknown>);
}
