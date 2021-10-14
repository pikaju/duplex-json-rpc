import { expect } from 'chai';
import {
  isResultResponse, isErrorResponse, isResponse, ResultResponse, ErrorResponse, Response,
} from '../../lib/types/response';

const resultResponses = [
  {
    jsonrpc: '2.0',
    result: 5,
    id: 'some-uuid',
  },
  {
    jsonrpc: '2.0',
    result: { worked: true },
    id: 5,
  },
  {
    jsonrpc: '2.0',
    result: [1, 2, 3],
    id: null,
  },
] as ResultResponse[];

const errorResponses = [
  {
    jsonrpc: '2.0',
    error: {
      code: 123,
      message: 'Things did not work out',
    },
    id: 'some-uuid',
  },
  {
    jsonrpc: '2.0',
    error: {
      code: -123,
      message: 'Things did not work out',
      data: 5,
    },
    id: 5,
  },
  {
    jsonrpc: '2.0',
    error: {
      code: 123,
      message: 'Things did not work out',
      data: { hi: 'how you doin' },
    },
    id: null,
  },
] as ErrorResponse[];

const invalidResponses = [
  undefined,
  null,
  {},
  true,
  {
    jsonrpc: '2.0',
    error: {
      code: 123,
      message: 'Things did not work out',
      data: { hi: 'how you doin' },
    },
    id: true, // Boolean ID
  },
  {
    jsonrpc: '2.0',
    result: 5, // Result and error defined
    error: {
      code: 123,
      message: 'Things did not work out',
      data: { hi: 'how you doin' },
    },
    id: 'uuid',
  },
  {
    jsonrpc: '2.0',
    error: {}, // Error object missing values
    id: 'uuid',
  },
  {
    jsonrpc: '2.0',
    error: {
      code: 123,
      message: true, // Boolean error message
    },
    id: 'uuid',
  },
  {
    jsonrpc: '2.0',
    error: {
      code: true, // Boolean error code
      message: '',
    },
    id: 'uuid',
  },
  {
    jsonrpc: '3.0', // Invalid version
    result: 5,
    id: 'uuid',
  },
];

describe('isResultResponse', () => {
  it('returns true for valid result responses', () => {
    resultResponses.forEach((response) => expect(isResultResponse(response)).to.be.true);
  });
  it('returns false for invalid result responses', () => {
    invalidResponses.forEach((response) => expect(isResultResponse(response)).to.be.false);
    errorResponses.forEach((response) => expect(isResultResponse(response)).to.be.false);
  });
});

describe('isErrorResponse', () => {
  it('returns true for valid error responses', () => {
    errorResponses.forEach((response) => expect(isErrorResponse(response)).to.be.true);
  });
  it('returns false for invalid error responses', () => {
    invalidResponses.forEach((response) => expect(isErrorResponse(response)).to.be.false);
    resultResponses.forEach((response) => expect(isErrorResponse(response)).to.be.false);
  });
});

describe('isResponse', () => {
  it('returns true for valid responses', () => {
    resultResponses.forEach((response) => expect(isResponse(response)).to.be.true);
    errorResponses.forEach((response) => expect(isResponse(response)).to.be.true);
  });
  it('returns false for invalid responses', () => {
    invalidResponses.forEach((response) => expect(isResponse(response)).to.be.false);
  });
});
