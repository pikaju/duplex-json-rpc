/* eslint-disable no-use-before-define */

import { Id, Parameters } from './types';

/**
 * Base class for JSON-RPC errors.
 */
export default abstract class JsonRpcError extends Error {}

/**
 * JSON-RPC error indicating that the server's response was invalid.
 */
export class InvalidResponseError extends JsonRpcError {
  constructor(response: unknown) {
    super(`Invalid JSON-RPC response: ${response as string}`);
  }
}

/**
 * JSON-RPC error indicating that the incoming packet could not be processed by a duplex server.
 */
export class InvalidDuplexPacketError extends JsonRpcError {
  constructor(packet: unknown) {
    super(`Invalid JSON-RPC duplex packet: ${packet as string}`);
  }
}

/**
 * JSON-RPC error indicating that the server response's ID could not be matched with a lingering call.
 */
export class UnmatchedResponseError extends JsonRpcError {
  constructor(id: Id) {
    super(`The JSON-RPC response ${id as string} could not be matched with its request`);
  }
}

/**
 * Base class for all JSON-RPC errors that are part of the protocol and hence be represented by JSON-RPC error objects.
 */
export class HandledError extends JsonRpcError {
  constructor(public codeField: number, public messageField: string, public dataField?: unknown) {
    super(`A JSON-RPC error occurred: "${messageField}" (code: ${codeField}, data: ${dataField as string})`);
  }

  /**
   * Construcs a handled error that is potentially a subtype one of the predefined subtypes based on the error code.
   * @param code JSON-RPC error code.
   * @param defaultMessage JSON-RPC error message to be used if it is not automatically inferred by the subtype.
   * @param data JSON-RPC data field.
   * @returns An instance of a handled error.
   */
  static createFromCode(code: number, defaultMessage: string, data?: unknown): HandledError {
    switch (code) {
      case -32700: return new ParseError(data as string);
      case -32600: return new InvalidRequestError(data);
      case -32601: return new MethodNotFoundError(data as string);
      case -32602: return new InvalidParamsError(data as Parameters);
      case -32603: return new InternalError(data);
      default: return new HandledError(code, defaultMessage, data);
    }
  }
}

/**
 * JSON-RPC error indicating that the request was unable to be parsed.
 */
export class ParseError extends HandledError {
  constructor(packet?: string, message?: string) {
    super(-32700, message ?? 'Parse error', packet);
  }
}

/**
 * JSON-RPC error indicating that the request was invalid.
 */
export class InvalidRequestError extends HandledError {
  constructor(request?: unknown, message?: string) {
    super(-32600, message ?? 'Invalid Request', request);
  }
}

/**
 * JSON-RPC error indicating that the requested method does not exist.
 */
export class MethodNotFoundError extends HandledError {
  constructor(method?: string, message?: string) {
    super(-32601, message ?? 'Method not found', method);
  }
}

/**
 * JSON-RPC error indicating that the params value provided with the request was invalid.
 */
export class InvalidParamsError extends HandledError {
  constructor(parameters?: Parameters, message?: string) {
    super(-32602, message ?? 'Invalid params', parameters);
  }
}

/**
 * JSON-RPC error indicating that an internal error occurred.
 */
export class InternalError extends HandledError {
  constructor(dataField?: unknown, message?: string) {
    super(-32603, message ?? 'Internal error', dataField);
  }
}
