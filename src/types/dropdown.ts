export interface DropdownItem {
  icon?: string;
  title: string;
  handler: () => void | Promise<void>;
}
