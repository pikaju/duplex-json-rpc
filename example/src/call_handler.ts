import WebSocket from 'ws';
import * as JsonRpc from 'duplex-json-rpc';

interface GetUserRequest {
  id: string;
}

function isGetUserRequest(value: unknown): value is GetUserRequest {
  if (value === null || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string') return false;
  return true;
}

interface User {
  name: string;
}

export default {
  async getUser(params, context): Promise<User> {
    if (!isGetUserRequest(params)) throw new JsonRpc.InvalidParamsError(params);
    if (params.id !== '5') throw new JsonRpc.HandledError(404, 'User not found');

    return {
      name: 'John Smith',
    };
  },
} as JsonRpc.CallHandler<WebSocket>;
