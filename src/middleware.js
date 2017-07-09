const React = require('react');
const { readdirSync } = require('fs');
const { resolve } = require('path');
const { renderRoutes, matchRoutes } = require('react-router-config');
const {
  isObject,
  isFunction,
  isString,
  isArray,
  arrayHasValues,
  resolveComponent,
  renderComponent,
  avoidXSS,
} = require('./helpers.js');

module.exports = (options) => {
  if (isObject(options)) {

    // Get variables from options (if they were passed...)
    let { templateHTML, mountId, componentsPath } = options, routes = false;

    // Check if routes option is valid:
    if (('routes' in options)) {
      if (!isArray(options.routes)) {
        throw new Error('"react-render-middleware" -> "routes" property must be an array.');
      }
      if (arrayHasValues(options.routes)) {
        routes = true;
      }
    }

    // This option is used independently if routes were found or not.
    if (!templateHTML) {
      throw '"react-render-middleware" -> "templateHTML" property must be defined';
    } else {
      if (!isString(templateHTML)) {
        throw '"react-render-middleware" -> "templateHTML" must be a string path type';
      }
    }

    // This option is used independently if routes were found or not.
    if (!mountId) {
      throw '"react-render-middleware" -> "mountId" property must be defined';
    } else {
      if (!isString(mountId)) {
        throw '"react-render-middleware" -> "mountId" must be a string path type';
      } else {
        if (!templateHTML.includes(`id="${mountId}"`)) {
          throw '"react-render-middleware" -> "mountId" was not found in the template';
        }
      }
    }

    // Check if componentsPath option is valid (only if routes were not found):
    if (!routes) {
      // Prepare component in case routes weren't provided in options.
      if (!componentsPath) {
        throw '"react-render-middleware" -> "componentsPath" property must be defined';
      } else {
        if (!isString(componentsPath)) {
          throw '"react-render-middleware" -> "componentsPath" must be a string path type';
        } else {
          try {
            readdirSync(componentsPath, { encoding: 'UTF-8' });
          } catch(err) {
            throw `\n"react-render-middleware" -> \nReason: Directory doesn't exists in the filesystem.\ncomponentsPath: "${componentsPath}"\nCode: "${err.code}"\n`;
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

          let component = matchRoutes(options.routes, req.url)[0].route.component.default;

          return { component, props };
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

                return { component, props };
              } else {
                throw new Error('"react-render-middleware" -> component was not found in the filesystem');
              }
            } else {
              throw new Error('"react-render-middleware" -> component argument must be a string type');
            }
          } else {
            throw new Error('"react-render-middleware" -> component argument must be defined');
          }
        }
      }

      function prepareContent(url, component, props, template, id) {
        // -------------------------------------------------------- Content:
        let content = renderComponent(url, component, props);
        let $ = require('cheerio').load(template);
        $('title').text(props.title);
        $('head').append(`<script id="__initial_state__">window.__INITIAL_STATE__ = ${avoidXSS(props)}</script>`);
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
            original: props,
            stringify: avoidXSS(props)
          },
          template: template,
          changes: {
            title: $('title').html(),
            state: $('#__initial_state__').html(),
            mount: $(`#${id}`).html()
          },
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
        let results = prepareContent(req.url, component, props, templateHTML, mountId);

        // ---------------------------------------------------------- Return:
        return prepareResults(results, arguments[arguments.length-1]);
      };

      // Call next:
      return next();
    };

    // Return the middleware:
    return middleware;
  } else {
    throw '"react-render-middleware" -> Options object was not passed to the middleware.'
  }
}