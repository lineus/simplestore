'use strict';

module.exports = {
  valueOrFunction,
  delay,
  props
};

/**
 * Return fn output given a fn, or the value of a primitive.
 * This allows params to either be a primitive or the output of
 * a function.
 *
 * @param {*} val - Value to use to set return.
 * @param {boolean} [overide=false] - Return fn without calling fn.
 * @returns {*} The primitive passed in or the output of the fn passed in.
 * @example
 * this.path = valueOrFunction('somepath.blargh');
 * // or
 * this.path = valueOrFunction(() => { return 'somepath.blargh'; });
 */
function valueOrFunction(val, overide = false) {
  if (typeof val === 'function' && !overide) {
    return val();
  } else {
    return val;
  }
}

/**
 * Simple fn that returns a promise that resolves in n milliseconds.
 *
 * @param {number} n - The number of milliseconds to wait before resolving.
 * @returns {Promise} That resolves in n milliseconds.
 * @example
 * async () => {
 *   await delay(1000); // resolve promise in 1 second.
 * };
 */
function delay(n) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, n);
  });
}

/**
 * Returns true if object has props, false if not.
 *
 * @param {object} obj - The object to test for the existence of properties.
 * @returns {boolean} Status of object props.
 * @example
 * if (props(myObj)) {
 *   console.log('we\'ve got props!');
 * }
 */
function props(obj) {
  return (typeof obj === 'object' && Object.keys(obj).length >= 1);
}
