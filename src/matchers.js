const { isObject, isFunction } = require('./helpers');

function toBeFunction(received, argument) {
  if (isFunction(received)) {
    return { pass: true, message: () => `Expected value to be a function.` }
  } else {
    return { pass: false, message: () => `Expected value not to be a function.` }
  }
}

function toBeObject(received, argument) {
  if (isObject(received)) {
    return { pass: true, message: () => `Expected value to be a object.` }
  } else {
    return { pass: false, message: () => `Expected value to be a object.` }
  }
}

module.exports.toBeFunction = toBeFunction;
module.exports.toBeObject = toBeObject;