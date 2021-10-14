import { expect } from 'chai';
import { isId } from '../../lib/types/id';

describe('isId', () => {
  it('returns true for valid IDs', () => {
    expect(isId('some-uuid')).to.be.true;
    expect(isId('')).to.be.true;
    expect(isId(5)).to.be.true;
    expect(isId(null)).to.be.true;
  });

  it('returns false for invalid IDs', () => {
    expect(isId(undefined)).to.be.false;
    expect(isId({ test: 5 })).to.be.false;
    expect(isId(true)).to.be.false;
  });
});
