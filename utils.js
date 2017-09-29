const helpers = require(__dirname+'/src/helpers.js');

module.exports.getComponentFromRoutes = helpers.getComponentFromRoutes;
module.exports.getRoute = helpers.getComponentByPathname;
module.exports.syncRouter = helpers.syncRouter;
