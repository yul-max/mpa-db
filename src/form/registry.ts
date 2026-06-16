export const fieldRegistry: Record<string, any> = {};
export function registerField(type: string, component: any) { fieldRegistry[type] = component; }
