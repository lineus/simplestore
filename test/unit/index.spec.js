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
        Store();
      }, /SeedRequiredError/);
    });
    it('returns disparate instances', () => {
      const x = Store({ data: { x: 'y' } });
      const y = Store({ data: { y: 'x' } });
      assert.strictEqual(x.y, undefined);
      assert.strictEqual(y.x, undefined);
    });
  });

  describe('basics', () => {
    it('allows a generic mutation', () => {
      const store = Store({
        mutations: {
          generic(state, input) {
            state[input.name] = input.value;
          }
        }
      });
      store.commit('generic', { name: 'a', value: 'yz' });
      store.commit('generic', { name: 'x', value: 'bc' });
      assert.strictEqual(store.a, 'yz');
      assert.strictEqual(store.x, 'bc');
    });

    it('generic mutation can\'t overwrite reserved words', () => {
      const store = Store({
        mutations: {
          generic(state, input) {
            state[input.name] = input.value;
          }
        }
      });
      assert.throws(() => {
        store.commit('generic', { name: 'action', value: 'xyz' });
      }, /DontTouchMyReservedwords: action/);
    });

    it('throws without a data or mutations property', () => {
      assert.throws(() => {
        Store({});
      }, /NoPointError/);
    });

    it('throws an error with nonexistent mutation', () => {
      const store = Store({ data: { a: 'bc' } });
      assert.throws(() => {
        store.commit('blargh');
      }, /NoSuchMutationError: blargh/);
    });

    it('throws an error with nonexistent action', () => {
      const store = Store({ data: { a: 'bc' } });
      assert.throws(() => {
        store.action('blargh');
      }, /NoSuchActionError: blargh/);
    });

    it('throws if a mutation or action isn\'t a function', () => {
      assert.throws(() => {
        Store({
          mutations: {
            one: 'string'
          }
        });
      }, /DisallowedTypeError: mutations can't accept string/);

      assert.throws(() => {
        Store({
          mutations: {
            one: (state, val) => state.blargh = val
          },
          actions: {
            one: 'string'
          }
        });
      }, /DisallowedTypeError: actions can't accept string/);
    });

    it('throws an error if a prop doesn\'t resolve to an object', () => {
      assert.throws(() => {
        Store({
          data: () => 'data'
        });
      }, /ValidationError: data/);
    });

    it('mutation not allowed directly', () => {
      const store = Store({
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
      const store = Store({ data: { a: 'bc' } });
      assert.throws(() => {
        console.log(store.data.a);
      }, /NoDirectAccessForYou/);
    });

    it('does not allow mutation of data object directly', () => {
      const store = Store({
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
        Store({
          data: {
            data: {}
          }
        });
      }, /DontTouchMyReservedwords: data/);

      assert.throws(() => {
        Store({
          data: {
            action: {}
          }
        });
      }, /DontTouchMyReservedwords: action/);

      assert.throws(() => {
        Store({
          data: {
            commit: {}
          }
        });
      }, /DontTouchMyReservedwords: commit/);
    });

    it('mutation allowed through commit', () => {
      const store = Store({
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
      const store = Store({
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
      const store = Store({
        data: () => {
          return {
            x: 'yz'
          };
        }
      });
      assert.strictEqual(store.x, 'yz');
    });

    it('allows a fn for mutations', () => {
      const store = Store({
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
      const store = Store({
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
      const store = Store({ data });
      const {x, a} = store;
      assert.strictEqual(x, 'yz');
      assert.strictEqual(a, 'bc');
    });

    it('allows an array in data object', () => {
      const store = Store({
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
