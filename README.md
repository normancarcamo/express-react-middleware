# express-react-middleware
A middleware able to render react components in your server with node.js as views, it is also able to render routes in an array of routes in react-router.

## Why?
Have you ever saw that whenever you're making a new project or when an existing project have to be updated you must to follow and do a lot of steps to achieve the desired outcome in the server when you want to apply SSR? Well, this middleware avoid having to remember all those steps even react-router.

## What are the target projects?
- For existing projects.
- For new projects.
- Projects who want to have better control of what components needs to be rendered in a specific resource.
- Projects who want to update their old configurations.

## Pre-requisites
  1. A html file to use as template.
  2. The html file must include a div or any element with an id attribute to mount the component.
  3. The components path or a file with all the routes. (see react-router v4 docs)

## Installation

``npm install --save express-react-middleware``
or
``yarn add express-react-middleware``

## Usage

There are 2 ways to use it in and is using a routes config file or by resolving the components.

#### template
The template is just an html file with a basic markup like this:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no">
    <meta http-equiv="X-UA-Compatible" content="IE=10; IE=9; IE=8; IE=7; IE=EDGE">
    <meta charset="utf-8"><meta name="description" content="">
    <meta name="keywords" content="">
    <meta name="author" content="">
    <title></title>
  </head>
  <body>
    <div id="root">Default template, this doesn't render any component</div>
    <script src="./bundle.js"></script>
  </body>
</html>
```

This is an example of how to require a template *(synchronous, recommended way)*:

```javascript
import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = (path) => resolve(__dirname, path)

let template = (() => {
  try {
    return readFileSync(root('./index.html'), { encoding: 'UTF-8' });
  } catch (err) {
    // If the template file *.html is not found then it throws an error instead of continuing the flow.
    throw err;
  }
})();
```

#### options

| name | type | optional | required | sync render | async render | description |
| ---- | ---- | -------- | -------- | ----------- | ------------ | ----------- |
| **templateHTML** | string | x | √ | √ | √ | The instance of the html file
| **mountId** | object | x | √ | √ | √ | The id of the element where the component or components will be rendered
| **componentsPath** | string | √ | (√/x) | √ | √ | Here you have to pass the absolute path to locate the components. (required if **routes** option is not set)  If routes option is present this option is ignored.
| **routes** | array | √ | (√/x) | √ | √ | the routes file used in react-router to match and render the components. (required if **componentsPath** is not set)

Example of how the options should be written:

```javascript

import { resolve } from 'path'
const root = (path) => resolve(__dirname, path)

let options = {
  templateHTML: template,
  mountId: "root",
  componentsPath: root("path/to/your/components")
};

// or with a file with the routes used in react-router:

import routes from './routes'

// ...

let options = {
  templateHTML: template,
  mountId: "root",
  routes: routes:
};
```

#### Use it in your app, router or elsewhere you want:
```javascript
import reactMiddleware from 'express-react-middleware'

// ...

app.use(reactMiddleware(options));
```

#### Render:

When the middleware has already been set you will find a new function property with the name **render** in the *request* object.

###### Arguments:
The `req.render` could take some arguments:

| name           | type     | optional | used in sync render | used in async render |
| -------------- | -------- | -------- | ------------------- | -------------------- |
| **component**  | string   | √        | √                   | √                    |
| **props**      | object   | √        | √                   | √                    |
| **callback**   | function | √        | x                   | √                    |

###### Returns:
When you have used the `req.render` function it will return an object with almost 6 properties:

| name          | type     | description |
| ------------- | -------- | ----------- |
| **html**      | string   | value containing the template html with the component rendered, the initial state and props. |
| **context**   | object   | used in redirections or to set customs status code to the response. |
| **component** | object   | The component found. |
| **props**     | object   | The properties that you passed before the render process |
| **template**  | string   | The original template value without any modification. |
| **changes**   | object   | Contains almost all the changes occurred |

###### Synchronous:
```javascript
app.get('/contact', (req, res) => {
  // 1.
  let { html, context } = req.render('contact');
  // ...

  // 2.
  let { html, context } = req.render('contact', { title: 'Contact', msg: 'Welcome!' });
  // ...

  // 3.
  let { html, context } = req.render('contact', null);
  // ...

  // 4. This maner is only valid if you have set the "routes" option in the middleware cause it uses "req.url" to find the component instead of having to write the name of a component react file:
  let { html, context } = req.render();
  // ...
});
```

###### Asynchronous:
```javascript
app.get('/contact', (req, res) => {
  // 1. contact is the name of a component and it is resolved with "componentsPath" (Only if routes option is not set).
  req.render('contact', ({html, context}) => {
    // ...
  });

  // 2.
  req.render('contact', {title: 'Contact', msg: 'Welcome!'}, ({html, context}) => {
    // ...
  });

  // 3.
  req.render('contact', null, ({html, context}) => {
    // ...
  });

  // 4. This maner is only valid if you have set the `routes` option in the middleware cause it uses `req.url` to find the component instead of having to write the name of a component react file:
  req.render(({html, context}) => {
    // ...
  });
})
```

###### Response:

``` javascript
app.get('/contact', (req, res) => {
  // ... {html, context}

  if (context.url) {
    res.redirect(context.status, context.url);
    // context.url is used to redirect or context.status when you need to send a specific status in your routes.
  } else {
    res.status(context.status).send(html);
    // html is a string value containing the template html also it contains the component rendered.
  }
});
```
## Tests:
``` bash
npm run test
```
![Image of Tests](https://raw.githubusercontent.com/normancarcamo/express-react-middleware/master/tests_preview.png)
<br/>
:+1:

## Examples:
See [examples folder](https://github.com/normancarcamo/express-react-middleware/tree/master/examples)

## Maintainers:

![Image of Mantainer](http://s.gravatar.com/avatar/c3d34f6dbeeef3c39942d0ecb1247228?s=80)<br/>
[Norman Carcamo](https://github.com/normancarcamo)<br/>
[NPM - modules](https://www.npmjs.com/~normanfx)<br/>