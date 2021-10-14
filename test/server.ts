import './setup';

import sinon from 'sinon';
import { expect } from 'chai';

import Server, { CallHandler } from '../lib/server';
import { SendCallback } from '../lib/send_callback';
import { Request } from '../lib/types';
import { HandledError } from '../lib/error';

describe('Server', () => {
  const callHandler = {
  } as CallHandler & Record<string, sinon.SinonStub>;
  let sendCallback: SendCallback & sinon.SinonSpy;
  let server: Server;

  beforeEach(() => {
    callHandler.resolvingMethod = sinon.stub().returns(Promise.resolve(6));
    callHandler.rejectingMethod = sinon.stub().returns(Promise.reject(new HandledError(31415, 'hi', true)));
    callHandler.brokenMethod = sinon.stub().returns(Promise.reject(new RangeError('whoops')));
    sendCallback = sinon.spy();
    server = new Server(callHandler, sendCallback);
  });

  it('calls the call handler with the correct parameters when a request is made', async () => {
    await server.onRequestPacket(JSON.stringify({
      jsonrpc: '2.0',
      method: 'resolvingMethod',
      params: [1, 2, 3],
      id: 'some-uuid',
    } as Request), 5);
    expect(callHandler.resolvingMethod.calledOnceWith([1, 2, 3], 5)).to.be.true;
    expect(callHandler.rejectingMethod.notCalled).to.be.true;
    await server.onRequestPacket(JSON.stringify({
      jsonrpc: '2.0',
      method: 'rejectingMethod',
      params: { id: 5 },
      id: 'some-uuid',
    } as Request), undefined);
    expect(callHandler.rejectingMethod.calledOnceWith({ id: 5 }, undefined)).to.be.true;
  });

  it('responds with the correct messages', async () => {
    await server.onRequestPacket(JSON.stringify({
      jsonrpc: '2.0',
      method: 'resolvingMethod',
      params: [1, 2, 3],
      id: 'some-uuid',
    } as Request), 5);
    expect(sendCallback.calledOnceWith(JSON.stringify({
      jsonrpc: '2.0',
      result: 6,
      id: 'some-uuid',
    }), 5)).to.be.true;
    sendCallback.resetHistory();
    await server.onRequestPacket(JSON.stringify({
      jsonrpc: '2.0',
      method: 'rejectingMethod',
      params: [1, 2, 3],
      id: 5,
    } as Request), undefined);
    expect(sendCallback.calledOnceWith(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: 31415, message: 'hi', data: true },
      id: 5,
    }), undefined)).to.be.true;
  });

  it('handles unplanned server errors', async () => {
    const promise = server.onRequestPacket(JSON.stringify({
      jsonrpc: '2.0',
      method: 'brokenMethod',
      params: [1, 2, 3],
      id: 5,
    } as Request), undefined);
    await expect(promise).to.eventually.be.rejectedWith(RangeError);
    expect(sendCallback.calledOnceWith(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
      },
      id: 5,
    }), undefined)).to.be.true;
  });

  it('automatically handles calls to non-existent methods', async () => {
    await server.onRequestPacket(JSON.stringify({
      jsonrpc: '2.0',
      method: 'doesntExist',
      params: [1, 2, 3],
      id: 5,
    } as Request), undefined);
    expect(sendCallback.calledOnceWith(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: 'Method not found',
        data: 'doesntExist',
      },
      id: 5,
    }), undefined)).to.be.true;
  });

  it('automatically handles unparsable calls', async () => {
    await server.onRequestPacket('This is not a valid request', undefined);
    expect(sendCallback.calledOnceWith(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        data: 'This is not a valid request',
      },
      id: null,
    }), undefined)).to.be.true;
  });

  it('automatically handles invalid JSON-RPC requests', async () => {
    const request = {
      jsonrpc: '1.9',
      method: 5,
      params: 3,
      id: false,
    };
    await server.onRequestPacket(JSON.stringify(request), undefined);
    expect(sendCallback.calledOnceWith(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid Request',
        data: request,
      },
      id: null,
    }), undefined)).to.be.true;
  });
});
