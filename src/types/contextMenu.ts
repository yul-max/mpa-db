export interface ContextSubMenuAction {
  title: string;
  toggled?: boolean;
}

export interface ContextAction {
  title: string;
  icon: string;
  action?: () => Promise<void> | void;
  submenu?: ContextSubMenuAction[];
  color?: string;
}
