import React, { useState } from 'react';
import { BrowserRouter as Switch, Route, Router } from 'react-router-dom';
 
/**
 * Import all page components here
 */
import Main from './Main';
import Account from './Account';
import Quote from './Quote';
 
const Routes = () => {
  console.log('started');
 
  return (
      <Switch> {/* The Switch decides which component to show based on the current URL.*/}
      <Route exact path='/'>
          <Main />
      </Route>
 
      <Route exact path='/account'>
        <Account />
      </Route>
 
      <Route exact path='/quote'>
          <Quote />
      </Route>
      
    </Switch>
  );
}
 
export default Routes;

