import { BaseMessage, isBaseMessage } from './message';

/**
 * Type describing the set of valid parameters included in a JSON-RPC call.
 */
export type Parameters = Record<string, unknown> | unknown[] | undefined;

/**
 * Interface describing all valid JSON-RPC request objects.
 */
export interface Request extends BaseMessage {
  method: string;
  params?: Parameters;
}

/**
 * Type guard for JSON-RPC requests.
 */
export function isRequest(value: unknown): value is Request {
  const record = value as Record<string, unknown>;
  if (!isBaseMessage(value)) return false;
  if (typeof record.method !== 'string') return false;
  if (record.params === null || !(typeof record.params === 'object' || Array.isArray(record.params) || typeof record.params === 'undefined')) return false;
  return true;
}
