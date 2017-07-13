// Dependencies:
import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Switch } from 'react-router';
import { renderRoutes, matchRoutes } from 'react-router-config';
import routes from '../shared/routes';
import { getComponentFromRoutes } from 'express-react-middleware/utils'

const reactRouter = !!(window.__INITIAL_STATE__ && window.__INITIAL_STATE__.rr)

if (reactRouter) {
  const props = window.__INITIAL_STATE__;
  const supportsHistory = 'pushState' in window.history;
  const { Component } = getComponentFromRoutes(routes, location.pathname);

  render((
    <BrowserRouter forceRefresh={!supportsHistory}>
      <Switch>
        <Component {...props} />
      </Switch>
    </BrowserRouter>
  ), document.getElementById("root"));
}