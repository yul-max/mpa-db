/**
 * Clears form values by returning an empty version of the provided form object
 * @param formTemplate - An object representing the form structure with initial values
 * @returns A new object with the same structure but all values cleared
 * @example
 * const loginForm = { username: '', password: '' };
 * const cleared = clearFormValues(loginForm);
 * // Result: { username: '', password: '' }
 *
 * const signupForm = { email: 'user@example.com', name: 'John', active: true };
 * const cleared = clearFormValues(signupForm);
 * // Result: { email: '', name: '', active: false }
 */
export function clearFormValues<T extends Record<string, any>>(formTemplate: T): T {
  const cleared = {} as T;

  for (const key in formTemplate) {
    if (Object.prototype.hasOwnProperty.call(formTemplate, key)) {
      const value = formTemplate[key];

      // Handle different value types
      if (typeof value === 'string') {
        (cleared as any)[key] = '';
      } else if (typeof value === 'number') {
        (cleared as any)[key] = 0;
      } else if (typeof value === 'boolean') {
        (cleared as any)[key] = false;
      } else if (Array.isArray(value)) {
        (cleared as any)[key] = [];
      } else if (value === null || value === undefined) {
        (cleared as any)[key] = null;
      } else if (typeof value === 'object') {
        // Recursively clear nested objects
        (cleared as any)[key] = clearFormValues(value);
      } else {
        (cleared as any)[key] = null;
      }
    }
  }

  return cleared;
}
