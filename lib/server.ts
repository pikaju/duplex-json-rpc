import { DefaultContext } from './context';
import {
  HandledError, InternalError, InvalidRequestError, MethodNotFoundError, ParseError,
} from './error';
import { SendCallback } from './send_callback';
import { Id } from './types/id';
import { isRequest, Parameters } from './types/request';
import { ErrorResponse, ResultResponse } from './types/response';

/**
 * Call handler type performing the logic when answering JSON-RPC requests.
 */
export interface CallHandler<Context = DefaultContext> {
  [key: string]: (parameters: Parameters, context: Context) => Promise<unknown> | unknown;
}

/**
 * Server for transport layer independent handling of JSON-RPC requests.
 */
export default class Server<Context = DefaultContext> {
  /**
   * Creates a new JSON-RPC server instance.
   *
   * @param callHandler `CallHandler` with JSON-RPC methods that will be called through incoming packets.
   * @param sendCallback `SendCallback` that sends a single packet across the desired transport channel.
   */
  constructor(
    private callHandler: CallHandler<Context>,
    private sendCallback: SendCallback<Context>,
  ) {}

  private async sendString(packet: string, context: Context): Promise<void> {
    await this.sendCallback(packet, context);
  }

  private sendResult(result: ResultResponse, context: Context): Promise<void> {
    return this.sendString(JSON.stringify(result), context);
  }

  private sendError(result: ErrorResponse, context: Context): Promise<void> {
    return this.sendString(JSON.stringify(result), context);
  }

  /**
   * Handles a single JSON-RPC request packet.
   *
   * @throws Any exception raised by the call handler that is not of type `HandledError`.
   *
   * @param packet String-encoded incoming JSON-RPC packet that shall be handled.
   * @param context User provided context for the call handler and send callback.
   */
  async onRequestPacket(packet: string, context: Context): Promise<void> {
    // "If there was an error in detecting the id in the Request object (e.g. Parse error/Invalid Request), it MUST be Null."
    // See: https://www.jsonrpc.org/specification.
    let id: Id = null;

    try {
      let parsed: unknown;
      // Try parsing the request.
      try {
        parsed = JSON.parse(packet);
      } catch (err) {
        throw new ParseError(packet);
      }
      if (!isRequest(parsed)) throw new InvalidRequestError(parsed);

      id = parsed.id;

      // Get the appropriate method handler from the call handler.
      const methodHandler = this.callHandler[parsed.method];
      if (!methodHandler) throw new MethodNotFoundError(parsed.method);

      // Invoke the method handler and await its result.
      const result = await methodHandler(parsed.params, context);

      // Send the result back to the client.
      await this.sendResult({
        jsonrpc: '2.0',
        result,
        id,
      }, context);
    } catch (err) {
      // Convert internal server errors into a JSON-RPC format.
      const responseError = err instanceof HandledError ? err : new InternalError();
      await this.sendError({
        jsonrpc: '2.0',
        error: {
          code: responseError.codeField,
          message: responseError.messageField,
          data: responseError.dataField,
        },
        id,
      }, context);

      // Throw unintended errors to be handled elsewhere.
      if (!(err instanceof HandledError)) throw err;
    }
  }
}
