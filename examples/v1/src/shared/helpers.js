const React = require('react');
const { StaticRouter } = require('react-router');
const { renderToString, renderToStaticMarkup } = require('react-dom/server');
const { matchRoutes } = require('react-router-config');

function isFunction(x) {
  return Object.prototype.toString.call(x) == '[object Function]';
}

function isString(input) {
  return (typeof input === "string") ? true : false;
}

function isObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  } else {
    var prototype = Object.getPrototypeOf(value)
    return prototype === null || prototype === Object.prototype
  }
}

function isUndefined(x) {
  return !!(x === undefined);
}

function isNull(x) {
  return !!(x === null);
}

function isBoolean(value) {
  return !!(typeof value === 'boolean');
}

function isArray(o) {
  return !!o && typeof o === "object" && o.length !== undefined;
}

function arrayHasValues(array) {
  if (array) {
    if (isArray(array)) {
      if (array.length) {
        return true
      } else {
        return false
      }
    } else {
      return false
    }
  } else {
    return false
  }
}

function avoidXSS(props) {
  return JSON.stringify(props).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}

function resolveComponent(path) {
  let result;
  try {
    result = require(path).default
  } catch (err) {
    result = false;
  } finally {
    return result;
  }
}

function renderComponent(location, Component, props) {
  let context = {}
  let content = React.createElement(StaticRouter, { location, context }, React.createElement(Component, JSON.parse(avoidXSS(props))));
  if (process.env.NODE_ENV === 'production') {
    return { html: renderToStaticMarkup(content), context: context }
  } else {
    return { html: renderToString(content), context: context }
  }
}

function getUrls(_routes) {
  // Usage: getUrls(routesArray) // -> ["/","/home","etc..."]...
  let arr = []
  function get(__) {
    __.forEach(route => {
      if ('path' in route) {
        arr.push(route.path)
      } else {
        if ('routes' in route) {
          get(route.routes)
        }
      }
    });
  }
  get(_routes);
  return arr
}

function getComponentByPathname(routes, path) {
  // Usage: getComponentByPathname('/topics', routesArray) // -> {...}
  let route_ = null;

  function get(_path, _routes) {
    _routes.some(route => {
      if ('path' in route && route.path === _path) {
        route_ = route
        return true
      } else {
        if ('routes' in route) {
          get(_path, route.routes)
        }
        return false
      }
    })
  }

  get(path, routes);
  return route_;
}

function getComponentFromRoutes(routes, url, props) {
  let output = {};

  if (arrayHasValues(routes)) {
    let branch = matchRoutes(routes, url);
    if (arrayHasValues(branch)) {
      if (objectHasValues(branch[0])) {
        if (objectHasValues(branch[0].route)) {
          if (objectHasValues(branch[0].route.component)) {
            if (isFunction(branch[0].route.component.default)) {
              // Default component found:
              output.Component = branch[0].route.component.default;
              output.isExact = true;
              output.found = true;

              // Check if the component dont exists:
              if (!branch[1].match.isExact) {
                let found = getComponentByPathname(routes, url);
                if (found && objectHasValues(found) && objectHasValues(found.component) && isFunction(found.component.default)) {
                  output.isExact = false;
                  output.found = true;
                  output.Component = found.component.default;
                }
              }
            }
          }
        }
      }
    }
  }

  if (isBrowser()) {
    output.element = React.createElement(output.Component, JSON.parse(avoidXSS(props || {})));
  }

  return output;
}

function isReactComponent(x) {
  return !!(x && objectHasValues(x) && ('$$typeof' in x) && (typeof x['$$typeof'] === 'symbol') && (x['$$typeof'].toString() === 'Symbol(react.element)'))
}

function objectHasValues(obj) {
  if (typeof obj === "object") {
    if (Object.getOwnPropertyNames(obj).length > 0) {
      return true;
    } else {
      return false;
    }
  } else if (typeof obj === 'undefined') {
    return false;
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

module.exports.isFunction = isFunction;
module.exports.isString = isString;
module.exports.isObject = isObject;
module.exports.isUndefined = isUndefined;
module.exports.isNull = isNull;
module.exports.isBoolean = isBoolean;
module.exports.isArray = isArray;
module.exports.isReactComponent = isReactComponent;
module.exports.arrayHasValues = arrayHasValues;
module.exports.objectHasValues = objectHasValues;
module.exports.avoidXSS = avoidXSS;
module.exports.resolveComponent = resolveComponent;
module.exports.renderComponent = renderComponent;
module.exports.getUrls = getUrls;
module.exports.getComponentByPathname = getComponentByPathname;
module.exports.getComponentFromRoutes = getComponentFromRoutes;
module.exports.isBrowser = isBrowser;