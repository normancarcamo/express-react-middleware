/* Components: */
const About    = require('./components/About');
const Contact  = require('./components/Contact');
const NotFound = require('./components/NotFound');

/* Routes: */
module.exports = [
  { path: '/about', component: About, },
  { path: '/contact', component: Contact },
  { component: NotFound },
];