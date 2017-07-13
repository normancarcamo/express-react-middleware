import React, { Component } from 'react';
import { Route, Link } from 'react-router-dom';
import { Switch } from 'react-router';

import About    from './About';
import Contact  from './Contact';
import Services from './Services';
import NotFound from './NotFound';

export default (props) => (
  <div>
    <ul>
      <li><Link to={`/about`}>About me</Link></li>
      <li><Link to={`/contact`}>Keep in touch with me</Link></li>
      <li><Link to={`/services`}>My services</Link></li>
    </ul>
    <hr/>
    <Switch>
      <Route exact path={`/portfolio`} render={() => (
        <div>Welcome to my portfolio!</div>
      )}/>
      <Route path={`/about`} component={About}/>
      <Route path={`/contact`} component={Contact}/>
      <Route path={`/services`} component={Services}/>
      <Route component={NotFound}/>
    </Switch>
  </div>
)