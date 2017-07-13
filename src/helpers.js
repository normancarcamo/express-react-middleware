const React = require('react');
const { StaticRouter } = require('react-router');
const { renderToString, renderToStaticMarkup } = require('react-dom/server');

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
    result = require(path).default
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
    console.info('The component you\'re trying to render seems to not exists.');
  } else {
    Component = React.createElement(component, JSON.parse(avoidXSS(props)));
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