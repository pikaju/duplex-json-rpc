import './setup';

import sinon from 'sinon';
import { expect } from 'chai';

import DuplexServer from '../lib/duplex';
import { CallHandler } from '../lib/server';
import { SendCallback } from '../lib/send_callback';
import { Request, Response } from '../lib/types';
import { InvalidDuplexPacketError } from '../lib/error';

describe('DuplexServer', () => {
  const callHandler = {
    coolMethod: sinon.stub().withArgs({ hi: 'sup' }).returns(Promise.resolve(5)),
  } as CallHandler & Record<string, sinon.SinonStub>;
  let spy: sinon.SinonSpy;
  let sendCallback: SendCallback;
  let server: DuplexServer;

  beforeEach(() => {
    spy = sinon.spy();
    sendCallback = (message, context) => { spy(JSON.parse(message), context); };
    server = new DuplexServer(callHandler, sendCallback);
  });

  it('responds to requests', async () => {
    await server.onDataPacket(JSON.stringify({
      jsonrpc: '2.0',
      method: 'coolMethod',
      params: { hi: 'sup' },
      id: 'some-uuid',
    } as Request), 5);
    expect(spy.calledOnceWith({
      jsonrpc: '2.0',
      result: 5,
      id: 'some-uuid',
    }, 5)).to.be.true;
  });

  it('can make calls itself', async () => {
    const promise = server.call('getUser', { id: 5 }, 8);
    const callId = (spy.lastCall.args[0] as Request).id;
    await server.onDataPacket(JSON.stringify({
      jsonrpc: '2.0',
      result: 'jsc',
      id: callId,
    } as Response), 8);
    await expect(promise).to.eventually.equal('jsc');
  });

  it('throws an appropriate error if messages are neither requests nor responses', async () => {
    await expect(server.onDataPacket(JSON.stringify({ not: 5, a: true, request: 'or response' }), undefined)).to.eventually.be.rejectedWith(InvalidDuplexPacketError);
  });
});
