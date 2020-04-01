'use strict';

const { props } = require('./lib/utils');

module.exports = Store;

const RESERVEDWORDS = [
  'data',
  'action',
  'commit'
];

const handler = {
  get: (target, prop) => {
    if (prop === 'commit') {
      return commit.bind(target);
    }

    if (prop === 'action') {
      return action.bind(target);
    }

    if (prop === 'data') {
      throw new Error('NoDirectAccessForYou: you must use a mutation.');
    }

    if (target.data[prop]) {
      return target.data[prop];
    }
  },
  set: () => {
    return true;
  }
};

/**
 * Store() returns a simple store object to ensure that setting
 * properties goes through one source of truth.
 *
 * @param {object} [seed] - The initial state of your store.
 * @param {Function|object} [seed.data] - The seed data for your new store.
 * @param {Function|object} [seed.mutations] - The only methods allowed to change state.
 * @param {Function|object} [seed.actions] - Async methods that can commit mutations.
 * @returns {object} Store object.
 * @example
 * const assert = require('assert');
 * const st8 = new Store({ data: { x: 'yz' } });
 * st8.x = 'abc';
 * assert.strictEqual(st8.x, 'yz');
 */
function Store(seed) {
  if(!seed || typeof seed !== 'object') {
    throw new Error('SeedRequiredError: Must supply object to `new Store()`');
  }

  const data = setProp(seed.data, 'data');
  const mutations = setProp(seed.mutations, 'mutations');
  const actions = setProp(seed.actions, 'actions');

  const hasAtLeastOneDataProp = props(data);
  const hasAtLeastOneMutation = props(mutations);

  if(!hasAtLeastOneDataProp && !hasAtLeastOneMutation) {
    throw new Error('NoPointError: Must have at least 1 data or mutation prop');
  }

  return Object.freeze(new Proxy({
    data,
    mutations,
    actions,
  }, handler));
}

/**
 * SetProp allows different inputs to result in a sane input object.
 *
 * @param {Function|object} value - Input fn or object to set initial value.
 * @param {string} desc - Denotes which prop is being set ( for errors ).
 * @returns {object} Initial Object.
 * @example
 * const store = new Store({
 *   data: Object.assign({}, setProp(seed.data)),
 * });
 */
function setProp(value, desc) {
  let ret;

  if (!value) {
    ret = {};
  }

  if (typeof value === 'function') {
    ret = value();
  }

  if (!ret) {
    ret = value;
  }

  const types = /(actions|mutations)/.test(desc) ?
    ['function'] :
    ['*'];

  return Object.assign({}, validate(ret, types, desc));
}

/**
 * Validate obj before setting it as the data property of our store.
 * At the moment, that consists of:
 * 1) making sure it's actually an object.
 * 2) ensuring the no one tries to set a conflicting reserved word.
 * 3) all mutations values are functions
 * 4) all actions values are functions.
 *
 * @param {object} obj - The object that will become the exhaulted data.
 * @param {[string]} types - Allowed types for values, ['*'] for all.
 * @param {string} desc - Added description string for better error.
 * @returns {object} - The validated object.
 * @throws DontTouchMyReservedwords, It's an error to set data.data, etc.
 * @throws DisallowedTypeError, mutations/actions can only be functions.
 * @example
 * validate(mySuperCoolObject, 'data');
 */
function validate(obj, types, desc) {
  if (!(typeof obj === 'object')) {
    throw new Error(`ValidationError: ${desc} doesn't resolve to an object`);
  }
  for (let key in obj) {
    if (RESERVEDWORDS.includes(key)) {
      throw new Error(`DontTouchMyReservedwords: ${key}`);
    }
  }

  if(Array.isArray(types) && types[0] === '*') {
    return obj;
  } else {
    for (let key in obj) {
      let t = typeof obj[key];
      if (Array.isArray(types) && !types.includes(t)) {
        throw new Error(`DisallowedTypeError: ${desc} can't accept ${t}`);
      }
    }
    return obj;
  }
}

/**
 * Runs a mutation from mutations object of the target.
 *
 * @param {string} name - The name of the mutation to run.
 * @param {string} value - The value to pass into the mutation.
 * @returns {*} Whatever the defined mutation returns.
 * @example
 * commit('doAThing', 'withThisString');
 */
function commit(name, value) {
  if (this.mutations[name]) {
    let ret = this.mutations[name](this.data, value);
    for (let key in this.data) {
      if (RESERVEDWORDS.includes(key)) {
        throw new Error(`DontTouchMyReservedwords: ${key}`);
      }
    }
    return ret;
  }
  throw new Error(`NoSuchMutationError: ${name} is not a registered mutation.`);
}

/**
 * Runs an action from actions object of the target.
 *
 * @param {string} name - The name of the action to run.
 * @param {string} value - The value to pass into the action.
 * @returns {*} Whatever the defined action returns.
 * @example
 * action('doAThing', 'withThisString');
 */
function action(name, value) {
  if (this.actions[name]) {
    return this.actions[name](commit.bind(this), value);
  }
  throw new Error(`NoSuchActionError: ${name} is not a registered action.`);
}
