import './setup';

import sinon from 'sinon';
import { expect } from 'chai';

import Client from '../lib/client';
import { SendCallback } from '../lib/send_callback';
import { Request, Response } from '../lib/types';
import {
  HandledError, InternalError, InvalidParamsError, InvalidRequestError, InvalidResponseError, MethodNotFoundError, ParseError, UnmatchedResponseError,
} from '../lib/error';

describe('Client', () => {
  let client: Client;
  let spy: sinon.SinonSpy;
  let sendCallback: SendCallback;

  beforeEach(() => {
    spy = sinon.spy();
    sendCallback = (message, context) => { spy(JSON.parse(message), context); };
    client = new Client(sendCallback);
  });

  it('sends the correct message with the correct context when performing calls', async () => {
    const promise = client.call('getUser', { id: 5 }, 8);
    const callId = (spy.lastCall.args[0] as Request).id;
    expect(typeof callId).to.equal('string');
    expect(spy.calledOnceWith({
      jsonrpc: '2.0',
      method: 'getUser',
      params: { id: 5 },
      id: callId,
    } as Request, 8)).to.be.true;
    await client.onResponsePacket(JSON.stringify({ jsonrpc: '2.0', id: callId, result: 'jsc' } as Response));
    await promise;
  });

  it('completes request promises with the result value', async () => {
    const promise = client.call('getUser', { id: 5 }, 8);
    const callId = (spy.lastCall.args[0] as Request).id;
    await client.onResponsePacket(JSON.stringify({
      jsonrpc: '2.0',
      result: 'jsc',
      id: callId,
    } as Response));
    await expect(promise).to.eventually.equal('jsc');
  });

  it('throws on invalid responses', async () => {
    await expect(client.onResponsePacket('nope')).to.eventually.be.rejectedWith(InvalidResponseError);
    await expect(client.onResponsePacket(JSON.stringify({
      jsonrpc: '1.9',
      error: {},
      id: true,
    }))).to.eventually.be.rejectedWith(InvalidResponseError);
  });

  it('throws if a response ID could not be matched with its request', async () => {
    await expect(client.onResponsePacket(JSON.stringify({
      jsonrpc: '2.0',
      result: 5,
      id: 'hi',
    } as Response))).to.eventually.be.rejectedWith(UnmatchedResponseError);
  });

  it('rejects request promises with values from the response\'s error object', async () => {
    const promise = client.call('getUser', { id: 5 }, 8);
    const callId = (spy.lastCall.args[0] as Request).id;
    await client.onResponsePacket(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: 31415,
        message: 'everything went wrong',
        data: [1, 2, 3],
      },
      id: callId,
    } as Response));
    await expect(promise).to.eventually.be.rejectedWith(HandledError);
    await promise.catch((err: HandledError) => {
      expect(err.codeField).to.equal(31415);
      expect(err.messageField).to.equal('everything went wrong');
      expect(err.dataField).to.eql([1, 2, 3]);
    });
  });

  it('parses standardized error codes to produce the correct error subtype instance', async () => {
    async function fakeError(code: number) {
      const promise = client.call('getUser', { id: 5 }, 8);
      const callId = (spy.lastCall.args[0] as Request).id;
      await client.onResponsePacket(JSON.stringify({
        jsonrpc: '2.0',
        error: { code, message: 'everything went wrong' },
        id: callId,
      } as Response));
      return promise;
    }
    await expect(fakeError(-32700)).to.eventually.be.rejectedWith(ParseError);
    await expect(fakeError(-32600)).to.eventually.be.rejectedWith(InvalidRequestError);
    await expect(fakeError(-32601)).to.eventually.be.rejectedWith(MethodNotFoundError);
    await expect(fakeError(-32602)).to.eventually.be.rejectedWith(InvalidParamsError);
    await expect(fakeError(-32603)).to.eventually.be.rejectedWith(InternalError);
  });
});
