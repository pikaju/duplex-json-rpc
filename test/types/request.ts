import { expect } from 'chai';
import { isRequest, Request } from '../../lib/types/request';

describe('isRequest', () => {
  it('returns true for valid requests', () => {
    expect(isRequest({
      jsonrpc: '2.0',
      method: 'getUser',
      params: { id: 5 },
      id: 'some-id',
    } as Request)).to.be.true;
    expect(isRequest({
      jsonrpc: '2.0',
      method: 'sum',
      params: [1, 2, 3],
      id: 3,
    } as Request)).to.be.true;
    expect(isRequest({
      jsonrpc: '2.0',
      method: 'sum',
      id: 3,
    } as Request)).to.be.true;
  });

  it('returns false for invalid requests', () => {
    expect(isRequest(undefined)).to.be.false;
    expect(isRequest(null)).to.be.false;
    expect(isRequest(false)).to.be.false;
    expect(isRequest(5)).to.be.false;
    expect(isRequest({
      jsonrpc: '2.5', // Wrong version
      method: 'getUser',
      params: { id: 5 },
      id: 'some-id',
    })).to.be.false;
    expect(isRequest({
      // Missing version
      method: 'getUser',
      params: { id: 5 },
      id: 'some-id',
    })).to.be.false;
    expect(isRequest({
      jsonrpc: '2.0',
      method: true, // Boolean method
      params: [1, 2, 3],
      id: 3,
    })).to.be.false;
    expect(isRequest({
      jsonrpc: '2.0',
      // No method
      params: [1, 2, 3],
      id: 3,
    })).to.be.false;
    expect(isRequest({
      jsonrpc: '2.0',
      method: 'getUser',
      params: 5, // Non-structured parameter
      id: 3,
    })).to.be.false;
    expect(isRequest({
      jsonrpc: '2.0',
      method: 'getUser',
      params: { id: 5 },
      id: true, // Boolean ID
    })).to.be.false;
  });
});
