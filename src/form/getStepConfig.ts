import { formSteps } from './steps';
import { formFieldList } from './fields';
import { buildFormSchema } from './rules';
export function getStepConfig(resource: string, mode: string) {
  const steps = formSteps?.[resource]?.[mode] || [];
  const stepSchemas = steps.map(s => buildFormSchema(s.fields));
  const stepFieldDefs = steps.map(s => s.fields.map((n: string) => formFieldList.find(f => f.name === n)));
  return { steps, stepSchemas, stepFieldDefs };
}
