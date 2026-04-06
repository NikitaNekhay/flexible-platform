const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates that a string looks like a UUID v4. */
export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

const STEP_ID_RE = /^[a-zA-Z0-9_.-]+$/;

/** Validates that a step ID contains only safe characters. */
export function isValidStepId(value: string): boolean {
  return value.length > 0 && value.length <= 128 && STEP_ID_RE.test(value);
}

const CHAIN_NAME_RE = /^[^<>"'`;]+$/;

/** Validates a chain name doesn't contain script-injection characters. */
export function isValidChainName(value: string): boolean {
  return value.length > 0 && value.length <= 256 && CHAIN_NAME_RE.test(value);
}
