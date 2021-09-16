import React from 'react';
import { BrowserRouter as Switch, Route, Router } from 'react-router-dom';

/**
 * Import all page components here
 */
import App from './App';
import Account from './Account';
import Quote from './Quote';
 
const Main = () => {
 
  return (
    
    <Switch> {/* The Switch decides which component to show based on the current URL.*/}
      <Route exact path='/'>
          <App />
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
 
export default Main;

