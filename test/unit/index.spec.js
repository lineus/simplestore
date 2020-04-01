'use strict';

const assert = require('assert');
const Store = require('../../');
const { delay } = require('../../lib/utils');

describe('STATE', () => {
  describe('smoketests', () => {
    it('is a function', () => {
      assert.strictEqual(typeof Store, 'function');
    });
    it('throws sans options object', () => {
      assert.throws(() => {
        new Store();
      }, /SeedRequiredError/);
    });
  });

  describe('basics', () => {
    it('throws without a data or mutations property', () => {
      assert.throws(() => {
        new Store({});
      }, /NoPointError/);
    });

    it('throws an error with nonexistent mutation', () => {
      const store = new Store({ data: { a: 'bc' } });
      assert.throws(() => {
        store.commit('blargh');
      }, /NoSuchMutationError: blargh/);
    });

    it('throws an error with nonexistent action', () => {
      const store = new Store({ data: { a: 'bc' } });
      assert.throws(() => {
        store.action('blargh');
      }, /NoSuchActionError: blargh/);
    });

    it('throws an error if a prop doesn\'t resolve to an object', () => {
      assert.throws(() => {
        new Store({
          data: () => 'data'
        });
      }, /ValidationError: data/);
    });

    it('mutation not allowed directly', () => {
      const store = new Store({
        data: {
          a: 'bc'
        },
        mutations: {
          set_a: (state, val) => state.a = val
        }
      });
      store.x = 'yz';
      assert.strictEqual(store.x, undefined);
    });

    it('does not allow direct access to data object', () => {
      const store = new Store({ data: { a: 'bc' } });
      assert.throws(() => {
        console.log(store.data.a);
      }, /NoDirectAccessForYou/);
    });

    it('does not allow mutation of data object directly', () => {
      const store = new Store({
        mutations: {
          setX: (state, val) => {
            state.x = val;
          }
        }
      });
      assert.throws(() => {
        store.data.x = 'yz';
      }, /NoDirectAccessForYou/);

      store.commit('setX', 'yz');
      assert.strictEqual(store.x, 'yz');
    });

    it('does not allow keywords in data object', () => {
      assert.throws(() => {
        new Store({
          data: {
            data: {}
          }
        });
      }, /DontTouchMyReservedwords: data/);

      assert.throws(() => {
        new Store({
          data: {
            action: {}
          }
        });
      }, /DontTouchMyReservedwords: action/);

      assert.throws(() => {
        new Store({
          data: {
            commit: {}
          }
        });
      }, /DontTouchMyReservedwords: commit/);
    });

    it('mutation allowed through commit', () => {
      const store = new Store({
        mutations: {
          setProp: (store, val) => {
            store.prop = val;
          }
        }
      });
      store.commit('setProp', 'fafafooey');
      assert.strictEqual(store.prop, 'fafafooey');
    });

    it('async action can commit mutation', async () => {
      const store = new Store({
        data: {
          x: null
        },
        mutations: {
          setX: (store, val) => {
            store.x = val;
          }
        },
        actions: {
          go: async (commit, v) => {
            await delay(1);
            commit('setX', v);
          }
        }
      });
      await store.action('go', 'tigerbalm');
      assert.strictEqual(store.x, 'tigerbalm');
    });

    it('allows a fn for data', () => {
      const store = new Store({
        data: () => {
          return {
            x: 'yz'
          };
        }
      });
      assert.strictEqual(store.x, 'yz');
    });

    it('allows a fn for mutations', () => {
      const store = new Store({
        data: {
          x: null
        },
        mutations: () => {
          return {
            setX: (state, v) => {
              state.x = v;
            }
          };
        }
      });
      store.commit('setX', 'yz');
      assert.strictEqual(store.x, 'yz');
    });

    it('allows a fn for actions', async () => {
      const store = new Store({
        data: {
          x: null
        },
        mutations: () => {
          return {
            setX: (state, v) => {
              state.x = v;
            }
          };
        },
        actions: () => {
          return {
            go: async (commit, v) => {
              await delay(1);
              commit('setX', v);
            }
          };
        }
      });
      await store.action('go', 'yz');
      assert.strictEqual(store.x, 'yz');
    });

    it('allows for destructuring object', () => {
      const data = {
        x: 'yz',
        a: 'bc'
      };
      const store = new Store({ data });
      const {x, a} = store;
      assert.strictEqual(x, 'yz');
      assert.strictEqual(a, 'bc');
    });

    it('allows an array in data object', () => {
      const store = new Store({
        data: {
          a: ['b', 'c']
        },
        mutations: {
          pushOntoA(state, val) {
            state.a.push(val);
          }
        }
      });
      store.commit('pushOntoA', 'd');
      store.commit('pushOntoA', 'e');
      store.commit('pushOntoA', 'f');
      assert.deepEqual(store.a, ['b', 'c', 'd', 'e', 'f']);
    });
  });
});
