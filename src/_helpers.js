const React = require('react');
const { StaticRouter } = require('react-router');
const { renderToString, renderToStaticMarkup } = require('react-dom/server');
const { renderRoutes, matchRoutes } = require('react-router-config');
const { BrowserRouter, HashRouter } = require('react-router-dom');
const { render } = require('react-dom');

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
  let Component;

  if (!component) {
    Component =  React.createElement('div', null, null);
    if (process.env.NODE_ENV !== 'production') {
      console.info('The component you\'re trying to render seems to not exists.');
    }
  } else {
    Component = React.createElement(component, JSON.parse(avoidXSS(props.props)));
  }

  let context = {};
  let content = React.createElement(StaticRouter, { location, context }, Component);

  if (process.env.NODE_ENV === 'production') {
    return { html: renderToStaticMarkup(content), context: context };
  } else {
    return { html: renderToString(content), context: context };
  }
}

function getComponentByPathname(routes, path) {
  let route_ = null

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
  let extract = isBoolean(arguments[arguments.length -1]) ? arguments[arguments.length -1] : false;
  let output = { url, props, extract };

  if (arrayHasValues(routes)) {
    let branch = matchRoutes(routes, url);
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
                  let found = getComponentByPathname(routes, url);
                  if (found && objectHasValues(found) && objectHasValues(found.component) && isFunction(found.component.default)) {
                    output.Component = found.component.default;
                  }
                }
              }
            } else if (isFunction(branch[0].route.component)) {
              output.Component = branch[0].route.component;

              // Check if the component dont exists:
              if (objectHasValues(branch[1]) && objectHasValues(branch[1].match) && !branch[1].match.isExact) {
                let found = getComponentByPathname(routes, url);
                if (found && objectHasValues(found) && objectHasValues(found.component) && isFunction(found.component.default)) {
                  output.Component = found.component.default;
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
            output.Component = routes[0].component
          }
        }
      }
    }
  }

  if (isBrowser()) {
    let Comp = output.Component;
    output.element = <Comp {...avoidXSS(props || {})} />
    //output.element = React.createElement(output.Component, JSON.parse(avoidXSS(props || {})));
  }

  return output;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function syncRouter(arrayRoutes, defaultComponent) {
  let properties = {};
  let component = null

  let router = window.__INITIAL_STATE__ && window.__INITIAL_STATE__.reactRouter;

  if (router) {
    let { url, props, extract } = window.__INITIAL_STATE__;

    // Get properties:
    if (isObject(props)) {
      properties = props;
    }

    // Get Component:
    if (arrayRoutes && isArray(arrayRoutes) && arrayHasValues(arrayRoutes) && isString(url)) {
      let { Component } = getComponentFromRoutes(arrayRoutes, url, properties, extract);
      component = Component;
    }
  }

  const output = {
    Router: window.location.origin.startsWith("file://") ? HashRouter : BrowserRouter,
    Component: component || defaultComponent || null,
    props: properties,
    refresh: !('pushState' in window.history),
    render: render,
    component: !!component
  };

  removeInitialState();
  disableLogHMR();

  if (isFunction(arguments[arguments.length -1])) {
    return arguments[arguments.length -1](output)
  } else {
    return output;
  }
}

function removeInitialState() {
  if (isBrowser()) {
    var parent = window.document.querySelector('head');
    var child = window.document.getElementById('__initial_state__');
    if (child) {
      parent.removeChild(child);
    }
    window.__INITIAL_STATE__ = null;
  }
}

function disableLogHMR() {
  if (isBrowser()) {
    if (process.env.NODE_ENV === 'development') {
      // This is a workaround used alongside the webpack-dev-server hot-module-reload feature
      //  - it's quite chatty on the console, and there's no currently no configuration option
      //    to silence it. Only used in development.
      // Prevent messages starting with [HMR] or [WDS] from being printed to the console
      (function(global) {
        let console_log = global.console.log
        global.console.log = function() {
          if (!(arguments.length == 1 && typeof arguments[0] === 'string' && arguments[0].match(/^\[(HMR|WDS)\]/))) {
            console_log.apply(global.console,arguments)
          }
        }
        // Credits to: https://github.com/webpack/webpack-dev-server/issues/109#issuecomment-143189783
      })(window)
    }
  }
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
module.exports.removeInitialState = removeInitialState;