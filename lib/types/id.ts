/**
 * Type of JSON-RPC IDs, following the spcification.
 */
export type Id = string | number | null;

/**
 * Type guard for JSON-RPC IDs.
 */
export function isId(value: unknown): value is Id {
  return value === null || typeof value === 'string' || typeof value === 'number';
}
