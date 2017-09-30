'use strict';

var React = require('react');

var _require = require('fs'),
    readdirSync = _require.readdirSync;

var _require2 = require('path'),
    resolve = _require2.resolve;

var _require3 = require('react-router-config'),
    renderRoutes = _require3.renderRoutes,
    matchRoutes = _require3.matchRoutes;

var _require4 = require('./helpers.js'),
    isObject = _require4.isObject,
    isFunction = _require4.isFunction,
    isString = _require4.isString,
    isArray = _require4.isArray,
    isBoolean = _require4.isBoolean,
    arrayHasValues = _require4.arrayHasValues,
    resolveComponent = _require4.resolveComponent,
    renderComponent = _require4.renderComponent,
    avoidXSS = _require4.avoidXSS,
    objectHasValues = _require4.objectHasValues,
    getComponentByPathname = _require4.getComponentByPathname,
    getComponentFromRoutes = _require4.getComponentFromRoutes;

module.exports = function (options) {
  if (isObject(options)) {

    // Prepare the middleware:
    var middleware = function middleware(req, res, next) {

      function prepareComponent() {
        if (routes) {
          var props = { title: 'Untitled' };

          if (arguments[0]) {
            if (isObject(arguments[0])) {
              props = Object.assign(props, arguments[0]);
            }
          }

          _url = _url ? _url : originalUrl ? req.originalUrl : req.url;
          var results = getComponentFromRoutes(options.routes.collection, _url, props, extract);
          results.reactRouter = true;

          return { component: results.Component, props: results };
        } else {
          if (arguments[0]) {
            if (isString(arguments[0])) {
              /* Require the component: */
              var component = resolveComponent(resolve(componentsPath, arguments[0]));

              if (component) {
                var _props = { title: 'Untitled' };

                if (arguments.length === 3 && isFunction(arguments[arguments.length - 1])) {
                  if (arguments[1]) {
                    if (isObject(arguments[1])) {
                      _props = Object.assign(_props, arguments[1]);
                    }
                  }
                }

                return { component: component, props: { reactRouter: false, props: _props } };
              } else {
                throw 'component was not found in the filesystem';
              }
            } else {
              throw 'component argument must be a string type';
            }
          } else {
            throw 'component argument must be defined';
          }
        }
      }

      function prepareContent(url, component, props, template, id) {
        // -------------------------------------------------------- Content:
        var content = renderComponent(url, component, props);
        var $ = require('cheerio').load(template);
        $('title').text(props.props.title);
        $('head').append('<script id="__initial_state__">window.__INITIAL_STATE__ = ' + avoidXSS(props) + ';</script>');
        $('#' + id).html(content.html);

        // -------------------------------------------------------- Return:
        return {
          html: $.html(),
          context: content.context,
          component: {
            original: component,
            rendered: content.html
          },
          props: {
            original: props.props,
            stringify: avoidXSS(props.props)
          },
          template: template,
          changes: {
            title: $('title').html(),
            state: $('#__initial_state__').html(),
            mount: $('#' + id).html()
          }
        };
      }

      function prepareResults(results, callback) {
        if (isFunction(callback)) {
          return callback(results);
        } else {
          return results;
        }
      }

      // Description: Add a new function called "render" to the req object:
      req.render = function render() {
        // ---------------------------------------------------------- Component & Props:
        var _prepareComponent = prepareComponent.apply(undefined, arguments),
            component = _prepareComponent.component,
            props = _prepareComponent.props;

        // ---------------------------------------------------------- Content:


        _url = _url ? _url : originalUrl ? req.originalUrl : req.url;
        var results = prepareContent(_url, component, props, templateHTML, mountId);

        // ---------------------------------------------------------- Return:
        return prepareResults(results, arguments[arguments.length - 1]);
      };

      // Call next:
      return next();
    };

    // Get variables from options (if they were passed...)
    var templateHTML = options.templateHTML,
        mountId = options.mountId,
        componentsPath = options.componentsPath,
        originalUrl = options.originalUrl,
        url = options.url;

    var routes = false;
    var extract = false;
    var _url = url || null;

    // Check if routes option is valid:
    if ('routes' in options) {
      if (!isObject(options.routes)) {
        throw '"routes" property must be an object.';
      } else {
        if ('collection' in options.routes) {
          if (!isArray(options.routes.collection)) {
            throw '"collection" property must be an array type.';
          }
        } else {
          throw '"routes" property must have a "collection" property.';
        }

        if ('extractComponent' in options.routes) {
          if (!isBoolean(options.routes.extractComponent)) {
            throw '"extractComponent" property must be a boolean type.';
          } else {
            extract = options.routes.extractComponent;
          }
        } else {
          extract = false;
        }
      }

      // if (!isArray(options.routes)) {
      //   throw new Error('"routes" property must be an array.');
      // }

      if (arrayHasValues(options.routes.collection)) {
        routes = true;
      }
    }

    // This option is used independently if routes were found or not.
    if (!templateHTML) {
      throw '"templateHTML" property must be defined';
    } else {
      if (!isString(templateHTML)) {
        throw '"templateHTML" must be a string path type';
      }
    }

    // This option is used independently if routes were found or not.
    if (!mountId) {
      throw '"mountId" property must be defined';
    } else {
      if (!isString(mountId)) {
        throw '"mountId" must be a string path type';
      } else {
        if (!templateHTML.includes('id="' + mountId + '"')) {
          throw '"mountId" was not found in the template';
        }
      }
    }

    // Check if componentsPath option is valid (only if routes were not found):
    if (!routes) {
      // Prepare component in case routes weren't provided in options.
      if (!componentsPath) {
        throw '"componentsPath" property must be defined';
      } else {
        if (!isString(componentsPath)) {
          throw '"componentsPath" must be a string path type';
        } else {
          try {
            readdirSync(componentsPath, { encoding: 'UTF-8' });
          } catch (err) {
            throw '\n\nReason: Directory doesn\'t exists in the filesystem.\ncomponentsPath: "' + componentsPath + '"\nCode: "' + err.code + '"\n';
          }
        }
      }
    };

    // Return the middleware:
    return middleware;
  } else {
    throw 'Options object was not passed to the middleware.';
  }
};
