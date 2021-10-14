import Client from './client';
import { DefaultContext } from './context';
import { InvalidDuplexPacketError } from './error';
import { SendCallback } from './send_callback';
import Server, { CallHandler } from './server';
import { isRequest, Parameters } from './types/request';
import { isResponse } from './types/response';

/**
 * Hybrid of the JSON-RPC client and server.
 *
 * Can handle incoming requests as well as perform RPC calls through a single connection channel.
 */
export default class DuplexServer<Context = DefaultContext> {
  private client: Client<Context>;
  private server: Server<Context>;

  constructor(
    callHandler: CallHandler<Context>,
    sendCallback: SendCallback<Context>,
  ) {
    this.client = new Client(sendCallback);
    this.server = new Server(callHandler, sendCallback);
  }

  /**
   * Performs a single JSON-RPC request.
   *
   * @param method Name of the JSON-RPC method to be called on the other server.
   * @param parameters Parameters passed to the other server as part of the request.
   * @param context User defined context to be used by the send callback.
   */
  call(method: string, parameters: Parameters, context: Context): Promise<unknown> {
    return this.client.call(method, parameters, context);
  }

  /**
   * Handles a single JSON-RPC packet, which may be a request of a response.
   *
   * @throws Any exception raised by the call handler that is not of type `HandledError`.
   *
   * @param packet String-encoded incoming JSON-RPC packet that shall be handled.
   * @param context User provided context for the call handler and send callback.
   */
  async onDataPacket(packet: string, context: Context): Promise<void> {
    // Try parsing the request to see whether it is a request or response.
    let parsed: unknown;
    try {
      parsed = JSON.parse(packet);
    } catch (err) {
      throw new InvalidDuplexPacketError(packet);
    }

    // Handle the (potential) JSON-RPC object appropriately.
    if (isRequest(parsed)) {
      await this.server.onRequestPacket(packet, context);
    } else if (isResponse(parsed)) {
      await this.client.onResponsePacket(packet);
    } else {
      throw new InvalidDuplexPacketError(parsed);
    }
  }
}
