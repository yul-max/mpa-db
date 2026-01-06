import { formSteps } from './steps';
import { formFieldList } from './fields';
import { buildFormSchema } from './rules';
export function getStepConfig(resource: string, mode: string) {
  const steps = (formSteps as any)?.[resource]?.[mode] || [];
  const stepSchemas = (steps as any[]).map((s: any) => buildFormSchema(s.fields));
  const stepFieldDefs = (steps as any[]).map((s: any) => s.fields.map((n: string) => formFieldList.find(f => f.name === n)));
  return { steps, stepSchemas, stepFieldDefs };
}
