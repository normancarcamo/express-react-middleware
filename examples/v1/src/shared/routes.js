/* Components: */
const App      = require('../client/App');
const About    = require('../client/About');
const Contact  = require('../client/Contact');
const Services = require('../client/Services');
const NotFound = require('../client/NotFound');
const Prueba = require('../client/Prueba');
const Prueba2 = require('../client/Prueba2');

/* Routes: */
module.exports = [
  { component: App,
    routes: [
      { path: '/about', component: About, },
      { path: '/contact', component: Contact, },
      { path: '/services', component: Services },
      { component: NotFound },
    ],
  },
  { path: '/prueba', component: Prueba },
  { path: '/acme', component: Prueba2 },
];