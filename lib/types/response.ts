import { BaseMessage, isBaseMessage } from './message';

/**
 * Interface describing a JSON-RPC response object that includes a result and therefore no error object.
 * This follows the official specification.
 */
export interface ResultResponse extends BaseMessage {
  result: unknown;
  error?: never;
}

/**
 * Type guard for JSON-RPC response objects containing a result.
 */
export function isResultResponse(value: unknown): value is ResultResponse {
  const record = value as Record<string, unknown>;
  if (!isBaseMessage(record)) return false;
  if (typeof record.result === 'undefined') return false;
  if (typeof record.error !== 'undefined') return false;
  return true;
}

/**
 * Interface describing a JSON-RPC response object that includes an error and therefore no result value.
 * This follows the official specification.
 */
export interface ErrorResponse extends BaseMessage {
  result?: never;
  error: {
    code: number,
    message: string,
    data?: unknown,
  };
}

/**
 * Type guard for JSON-RPC response objects containing an error.
 */
export function isErrorResponse(value: unknown): value is ResultResponse {
  const record = value as Record<string, unknown>;
  if (!isBaseMessage(record)) return false;
  if (typeof record.result !== 'undefined') return false;
  if (typeof record.error !== 'object' || record.error === null) return false;

  const errorRecord = record.error as Record<string, unknown>;
  if (typeof errorRecord.code !== 'number') return false;
  if (typeof errorRecord.message !== 'string') return false;
  return true;
}

/**
 * Type describing all JSON-RPC responses, regardless of whether they contain a result or an error.
 */
export type Response = ResultResponse | ErrorResponse;

/**
 * Type guard for JSON-RPC responses.
 */
export function isResponse(value: unknown): value is Response {
  return isResultResponse(value) || isErrorResponse(value);
}
