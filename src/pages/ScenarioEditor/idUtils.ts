/** Simple fallback ID generator (no crypto dependency required). */
let counter = 0;
export function v4Fallback(): string {
  counter++;
  return `${Date.now().toString(36)}_${counter.toString(36)}`;
}
