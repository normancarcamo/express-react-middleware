'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var React = require('react');

var _require = require('react-router'),
    StaticRouter = _require.StaticRouter;

var _require2 = require('react-dom/server'),
    renderToString = _require2.renderToString,
    renderToStaticMarkup = _require2.renderToStaticMarkup;

var _require3 = require('react-router-config'),
    renderRoutes = _require3.renderRoutes,
    matchRoutes = _require3.matchRoutes;

function isFunction(x) {
  return Object.prototype.toString.call(x) == '[object Function]';
}

function isString(input) {
  return typeof input === "string" ? true : false;
}

function isObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  } else {
    var prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
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
  return !!o && (typeof o === 'undefined' ? 'undefined' : _typeof(o)) === "object" && o.length !== undefined;
}

function isReactComponent(x) {
  return !!(x && objectHasValues(x) && '$$typeof' in x && _typeof(x['$$typeof']) === 'symbol' && x['$$typeof'].toString() === 'Symbol(react.element)');
}

function objectHasValues(obj) {
  if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === "object") {
    if (Object.getOwnPropertyNames(obj).length > 0) {
      return true;
    } else {
      return false;
    }
  } else if (typeof obj === 'undefined') {
    return false;
  }
}

function arrayHasValues(array) {
  if (array) {
    if (isArray(array)) {
      if (array.length) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function avoidXSS(props) {
  return JSON.stringify(props).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}

function resolveComponent(path) {
  var result = void 0;
  try {
    if (process.env.NODE_ENV !== "production") {
      delete require.cache[require.resolve(path)];
    }
    result = require(path).default;
  } catch (err) {
    result = false;
  } finally {
    return result;
  }
}

function renderComponent(location, component, props) {
  var Component = void 0;

  if (!component) {
    Component = React.createElement('div', null, null);
    if (process.env.NODE_ENV !== 'production') {
      console.info('The component you\'re trying to render seems to not exists.');
    }
  } else {
    Component = React.createElement(component, JSON.parse(avoidXSS(props.props)));
  }

  var context = {};
  var content = React.createElement(StaticRouter, { location: location, context: context }, Component);

  if (process.env.NODE_ENV === 'production') {
    return { html: renderToStaticMarkup(content), context: context };
  } else {
    return { html: renderToString(content), context: context };
  }
}

function getComponentByPathname(routes, path) {
  var route_ = null;

  function get(_path, _routes) {
    _routes.some(function (route) {
      if ('path' in route && route.path === _path) {
        route_ = route;
        return true;
      } else {
        if ('routes' in route) {
          get(_path, route.routes);
        }
        return false;
      }
    });
  }

  get(path, routes);
  return route_;
}

function getComponentFromRoutes(routes, url, props) {
  var extract = isBoolean(arguments[arguments.length - 1]) ? arguments[arguments.length - 1] : false;
  var output = { url: url, props: props, extract: extract };

  if (arrayHasValues(routes)) {
    var branch = matchRoutes(routes, url);
    if (arrayHasValues(branch)) {
      if (extract) {
        if (objectHasValues(branch[0])) {
          if (objectHasValues(branch[0].route)) {
            if (objectHasValues(branch[0].route.component)) {
              if (isFunction(branch[0].route.component.default)) {
                // Default component found:
                output.Component = branch[0].route.component.default;

                // Check if the component dont exists:
                if (objectHasValues(branch[1]) && objectHasValues(branch[1].match) && !branch[1].match.isExact) {
                  var found = getComponentByPathname(routes, url);
                  if (found && objectHasValues(found) && objectHasValues(found.component) && isFunction(found.component.default)) {
                    output.Component = found.component.default;
                  }
                }
              }
            } else if (isFunction(branch[0].route.component)) {
              output.Component = branch[0].route.component;

              // Check if the component dont exists:
              if (objectHasValues(branch[1]) && objectHasValues(branch[1].match) && !branch[1].match.isExact) {
                var _found = getComponentByPathname(routes, url);
                if (_found && objectHasValues(_found) && objectHasValues(_found.component) && isFunction(_found.component.default)) {
                  output.Component = _found.component.default;
                }
              }
            }
          }
        }
      } else {
        if (branch[0].route.component.default) {
          output.Component = branch[0].route.component.default;
        } else {
          output.Component = branch[0].route.component;
        }
      }
    } else {
      if (isArray(routes) && arrayHasValues(routes) && routes.length === 1) {
        if (isObject(routes[0]) && objectHasValues(routes[0])) {
          if (isFunction(routes[0].component)) {
            output.Component = routes[0].component;
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

function isBrowser() {
  return typeof window !== 'undefined';
}

function syncRouter(arrayRoutes, defaultComponent) {
  var properties = {};
  var component = null;

  if (isBrowser) {
    console.log('Browser ok');
    var router = window.__INITIAL_STATE__ && window.__INITIAL_STATE__.reactRouter;

    if (router) {
      console.log('Router ok');
      var _window$__INITIAL_STA = window.__INITIAL_STATE__,
          url = _window$__INITIAL_STA.url,
          props = _window$__INITIAL_STA.props,
          extract = _window$__INITIAL_STA.extract;

      // Get properties:

      if (isObject(props)) {
        properties = props;
      }

      // Get Component:
      if (arrayRoutes && isArray(arrayRoutes) && arrayHasValues(arrayRoutes) && isString(url)) {
        var _getComponentFromRout = getComponentFromRoutes(arrayRoutes, url, properties, extract),
            Component = _getComponentFromRout.Component;

        component = Component;
      }
    } else {
      console.log('Router was not found.');
    }
  }

  return {
    Component: component || defaultComponent || null,
    props: properties
  };
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
module.exports.getComponentByPathname = getComponentByPathname;
module.exports.getComponentFromRoutes = getComponentFromRoutes;
module.exports.isBrowser = isBrowser;
module.exports.syncRouter = syncRouter;
