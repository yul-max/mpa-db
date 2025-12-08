import { App } from 'vue';
import { registerField } from './registry';
export default { install(app: App, options: any = {}) { if (options.fields) Object.entries(options.fields).forEach(([k, c]) => registerField(k, c)); } };

