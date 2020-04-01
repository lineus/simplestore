'use strict';

const { isPromise } = require('util').types;
const assert = require('assert');
const utils = require('../../lib/utils');

describe('utils/', () => {
  describe('valueOrFunction', () => {
    const { valueOrFunction } = utils;
    it('smoketest', () => {
      assert.strictEqual(typeof valueOrFunction, 'function');
    });

    it('returns primitive input', () => {
      assert.strictEqual(valueOrFunction('test'), 'test');
    });

    it('returns fn output', () => {
      assert.strictEqual(valueOrFunction(() => 'test'), 'test');
    });

    it('calling fn can be overridden', () => {
      const fn = () => 'test';
      assert.strictEqual(valueOrFunction(fn, true), fn);
    });
  });

  describe('delay', () => {
    it('returns a promise', () => {
      const p = utils.delay(47);
      assert.strictEqual(isPromise(p), true);
    });
  });

  describe('props', () => {
    it('returns false sans props', () => {
      assert.strictEqual(utils.props({}), false);
    });
    it('returns true with props', () => {
      assert.strictEqual(utils.props({ a: 'bc' }), true);
    });
  });
});
