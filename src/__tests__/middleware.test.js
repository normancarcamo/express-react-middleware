import httpMocks from 'node-mocks-http';
import { resolve } from 'path'
import { readFileSync } from 'fs'
import cheerio from 'cheerio'
import sinon from 'sinon'
import reactRenderMiddleware from '../middleware.js';
import routes from '../../example/routes'

/* Custom matchers: */
import * as matchers from '../matchers';

/* Add the custom matchers to the expect object: */
expect.extend(matchers);

/* Custom helper variables: */
const root = (path) => resolve(process.cwd(), path);

/* Build tests: */
describe('Wrapper', () => {
  test('should be a function', () => {
    expect(reactRenderMiddleware).toBeFunction();
  });

  let mount = 'root';
  let options = {
    templateHTML: (() => {
      try {
        return readFileSync(root('example/index.html'), { encoding: 'UTF-8' });
      } catch (err) {
        throw err;
      }
    })(),
    mountId: mount,
    componentsPath: root('example/components'),
  };
  let middleware = reactRenderMiddleware(options);

  test('should return a function', () => {
    expect(middleware).toBeFunction();
  });

  describe('Middleware', () => {
    let req = httpMocks.createRequest();
    let res = httpMocks.createResponse();
    let next = sinon.spy();
    let componentName = 'App.js';

    middleware(req, res, next);

    test('should accept three arguments', () => {
      expect(middleware.length).toEqual(3);
    });

    test('should call next()', () => {
      expect(next.called).toBe(true);
    });

    test('request object should have a property called "render"', () => {
      expect(!!req.render).toBe(true);
    });

    test('render property should be a function', () => {
      expect(req.render).toBeFunction();
    });

    const testRender = (results) => {
      test('should return a plain object', () => {
        expect(results).toBeObject();
      });

      test('should have a html property', () => {
        expect(!!results.html).toBe(true);
      });

      let $ = cheerio.load(results.html);
      test('should have an "id" selector called: "__initial_state__"', () => {
        expect($('#__initial_state__').length).toBeGreaterThanOrEqual(1);
      });

      test('should have rendered into the html content', () => {
        let rendered = $(`#${mount}`).html() === "";
        expect(!rendered).toBe(true);
      });
    }

    describe('Render', function() {
      describe('Without router', function() {
        describe('Synchronous', () => {
          testRender(req.render(componentName));
        });

        describe('Asynchronous (callback)', () => {
          req.render(componentName, null, (results) => testRender(results));
        });
      });
      describe('With react-router', () => {
        options.routes = routes;
        middleware = reactRenderMiddleware(options);
        middleware(req, res, next);

        describe('Synchronous', () => {
          testRender(req.render({name: 'Norman'}));
        });

        describe('Asynchronous (callback)', () => {
          req.render(null, results => testRender(results));
        });
      });
    });
  });
});