import { isId, Id } from './id';

/**
 * Base type for all JSON-RPC messages.
 */
export interface BaseMessage {
  jsonrpc: '2.0';
  id: Id;
}

/**
 * Type guard for BaseMessage.
 */
export function isBaseMessage(value: unknown): value is BaseMessage {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.jsonrpc !== '2.0') return false;
  if (!isId(record.id)) return false;
  return true;
}
