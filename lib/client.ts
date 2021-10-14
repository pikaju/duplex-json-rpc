import { v4 as uuid } from 'uuid';
import { DefaultContext } from './context';
import Error, { InvalidResponseError, HandledError, UnmatchedResponseError } from './error';
import { SendCallback } from './send_callback';
import {
  Id,
  Parameters,
  Request,
  Response,
  isResponse,
  isResultResponse,
} from './types';

interface PendingRequest {
  resolve: (result: Response['result']) => void;
  reject: (error: Error) => void;
}

/**
 * Server for transport layer invocation of JSON-RPC calls.
 */
export default class Client<Context = DefaultContext> {
  private pendingRequests: Map<Id, PendingRequest>;

  /**
   * Creates a new Client instance.
   *
   * @param sendCallback Callback responsible for sending a single JSON-RPC request through the transport layer.
   */
  constructor(
    private sendCallback: SendCallback<Context>,
  ) {
    this.pendingRequests = new Map<Id, PendingRequest>();
  }

  private async sendString(packet: string, context: Context): Promise<void> {
    await this.sendCallback(packet, context);
  }

  private sendRequest(request: Request, context: Context): Promise<void> {
    return this.sendString(JSON.stringify(request), context);
  }

  /**
   * Performs a single JSON-RPC request.
   *
   * @param method Name of the JSON-RPC method to be called on the server.
   * @param parameters Parameters passed to the server as part of the request.
   * @param context User defined context to be used by the send callback.
   */
  async call(method: string, parameters: Parameters, context: Context): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // Generate a UUID and store it with the Promise's callbacks to be called whenever a response arrives.
      const id = uuid();
      this.pendingRequests.set(id, { resolve, reject });

      // Send the request to the server.
      this.sendRequest({
        jsonrpc: '2.0',
        method,
        params: parameters,
        id,
      }, context).catch(reject);
    });
  }

  /**
   * Handles a single JSON-RPC response packet.
   *
   * @throws {InvalidResponseError} if the response received was either unable to be parsed or does not follow the JSON-RPC standard.
   * @throws {UnmatchedResponseError} if the response has an ID which does not belong to any lingering request.
   *
   * @param packet String-encoded incoming JSON-RPC packet that shall be handled.
   * @param context User provided context for the call handler and send callback.
   */
  async onResponsePacket(packet: string): Promise<void> {
    // Try parsing the response object.
    let parsed: unknown;
    try {
      parsed = JSON.parse(packet);
    } catch (err) {
      throw new InvalidResponseError(packet);
    }
    if (!isResponse(parsed)) throw new InvalidResponseError(parsed);

    // Match the response with its request counterpart.
    const pendingRequest = this.pendingRequests.get(parsed.id);
    this.pendingRequests.delete(parsed.id);

    if (pendingRequest) {
      // Call the Promise's resolve for successful responses, and the reject for error responses.
      if (isResultResponse(parsed)) {
        pendingRequest.resolve(parsed.result);
      } else {
        pendingRequest.reject(HandledError.createFromCode(parsed.error.code, parsed.error.message, parsed.error.data));
      }
    } else {
      // Throw, if no matching request is registered.
      throw new UnmatchedResponseError(parsed.id);
    }
  }
}
