const React = require('react');
const { readdirSync } = require('fs');
const { resolve } = require('path');
const { renderRoutes, matchRoutes } = require('react-router-config');
const {
  isObject,
  isFunction,
  isString,
  isArray,
  isBoolean,
  arrayHasValues,
  resolveComponent,
  renderComponent,
  avoidXSS,
  objectHasValues,
  getComponentByPathname,
  getComponentFromRoutes,
} = require('./helpers.js');

module.exports = (options) => {
  if (isObject(options)) {

    // Get variables from options (if they were passed...)
    let { templateHTML, mountId, componentsPath, originalUrl, url } = options;
    let routes = false;
    let extract = false;
    let _url = url || null;

    // Check if routes option is valid:
    if (('routes' in options)) {
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
        if (!templateHTML.includes(`id="${mountId}"`)) {
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
          } catch(err) {
            throw `\n\nReason: Directory doesn't exists in the filesystem.\ncomponentsPath: "${componentsPath}"\nCode: "${err.code}"\n`;
          }
        }
      }
    }

    // Prepare the middleware:
    function middleware(req, res, next) {

      function prepareComponent() {
        if (routes) {
          let props = { title: 'Untitled' };

          if (arguments[0]) {
            if (isObject(arguments[0])) {
              props = Object.assign(props, arguments[0]);
            }
          }

          _url = _url ? _url : originalUrl ? req.originalUrl : req.url;
          let results = getComponentFromRoutes(options.routes.collection, _url, props, extract);
          results.reactRouter = true;

          return { component: results.Component, props: results };
        } else {
          if (arguments[0]) {
            if (isString(arguments[0])) {
              /* Require the component: */
              let component = resolveComponent(resolve(componentsPath, arguments[0]));

              if (component) {
                let props = { title: 'Untitled' };

                if (arguments.length === 3 && isFunction(arguments[arguments.length-1])) {
                  if (arguments[1]) {
                    if (isObject(arguments[1])) {
                      props = Object.assign(props, arguments[1]);
                    }
                  }
                }

                return { component, props: { reactRouter: false, props: props } };
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
        let content = renderComponent(url, component, props);
        let $ = require('cheerio').load(template);
        $('title').text(props.props.title);
        $('head').append(`<script id="__initial_state__">window.__INITIAL_STATE__ = ${avoidXSS(props)};</script>`);
        $(`#${id}`).html(content.html);

        // -------------------------------------------------------- Return:
        return {
          html: $.html(),
          context: content.context,
          component: {
            original: component,
            rendered: content.html,
          },
          props: {
            original: props.props,
            stringify: avoidXSS(props.props)
          },
          template: template,
          changes: {
            title: $('title').html(),
            state: $('#__initial_state__').html(),
            mount: $(`#${id}`).html()
          },
          routes: routes ? options.routes.collection : null,
          route: routes ? getComponentByPathname(options.routes.collection, _url) : null
        };
      }

      function prepareResults(results, callback) {
        if (isFunction(callback)) {
          return callback(results);
        } else {
          return results
        }
      }

      // Description: Add a new function called "render" to the req object:
      req.render = function render() {
        // ---------------------------------------------------------- Component & Props:
        let { component, props } = prepareComponent(...arguments);

        // ---------------------------------------------------------- Content:
        _url = _url ? _url : originalUrl ? req.originalUrl : req.url;
        let results = prepareContent(_url, component, props, templateHTML, mountId);

        // ---------------------------------------------------------- Return:
        return prepareResults(results, arguments[arguments.length-1]);
      };

      // Call next:
      return next();
    };

    // Return the middleware:
    return middleware;
  } else {
    throw 'Options object was not passed to the middleware.'
  }
}
