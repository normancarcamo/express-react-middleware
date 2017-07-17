import { Router } from 'express'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import middleware from 'express-react-middleware'
import routes from '../shared/routes'

const router = Router()

/* This helper variable will be used to find the components and the directory base of the components: */
const root = (src) => resolve(process.cwd(), src)

/*
 Is a good idea to keep our template in memory rather to requiring it in every request.
 The changes over the template will never modify the original file in the filesystem,
 instead it's taken from memory.
 */
let template = (() => {
  try {
    /* If the template file *.html is found then it returns the content to save it into the "template" variable. */
    return readFileSync(root('build/index.html'), { encoding: 'UTF-8' });
  } catch (err) {
    /* If the template file *.html is not found then it throws an error instead of continuing the flow. */
    throw err;
  }
})();

// Send your default html file template:
router.get('/', (req, res) => {
  res.send(template);
});

router.use(middleware({
  templateHTML: template,
  mountId: 'root',
  componentsPath: root('src/client')
}));

// common use (without react-router):
router.get('/one', (req, res) => {
  req.render('One', { title: 'High Order Component', name: 'Guess' }, ({ html, context }) => {
    if (context.url) {
      // We can use the `context.status` added in RedirectWithStatus:
      res.redirect(context.status, context.url);
    } else {
      res.status(200).send(html);
    }
  });
});

// render a component asynchronous:
router.get('/two', (req, res) => {
  req.render('Two', null, ({ html, context }) => {
    if (context.url) {
      res.redirect(context.status, context.url);
    } else {
      res.send(html);
    }
  });
});

// render a component synchronous:
router.get('/three', (req, res) => {
  let { html, context } = req.render('Three');
  if (context.url) {
    res.redirect(context.status, context.url);
  } else {
    res.send(html);
  }
});

/* Using react-router. */
router.use(middleware({
  templateHTML: template,
  mountId: 'root',
  routes: { collection: routes }
}));

router.get('*', (req, res) => {
  req.render(({html, context, component}) => {
    if (context.url) {
      res.redirect(context.status, context.url);
    } else if (context.status) {
      res.status(context.status).send(html);
    } else {
      res.send(html);
    };
  });
});

export default router;