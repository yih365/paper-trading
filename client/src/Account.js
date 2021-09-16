import React from "react";
import "./Account.css";
import { Redirect } from "react-router-dom";
import Axios from 'axios';
import { useHistory } from "react-router-dom";
 
function Account() {
  let history = useHistory();
 
  const [loginStatus, setLoginStatus] = React.useState(null);
  const [portfolioItems, setPortfolioItems] = React.useState([]);
 
  /**
   * Redirect if not logged in
   */
  React.useEffect(() => {
    Axios.get('/api/login').then((response) => {
      if (response.data.loggedIn === true) {
        setLoginStatus(true);
      } else {
        setLoginStatus(false);
      };
      console.log(response);
    });
 
    /**
     * Request for portfolio info
     */
     Axios.get('/api/account').then((response) => {
      console.log(response);
      if (response.data.err) {
        console.log(response.data.err);
        setPortfolioItems([<li>Sorry there has been an error</li>]);
      } else {
        let items = [];
        if (response.data.cash) setPortfolioItems([<li>{'Cash: $' + response.data.cash}</li>]);
        setPortfolioItems(oldArray => [...oldArray, <br/>]);
        if (response.data.portfolioItems) {
          for (let item of response.data.portfolioItems) {
            setPortfolioItems(oldArray => [...oldArray, <li>{item.symbol + ': ' + item.shares + ' shares'}</li>]);
          };
        };
      }
    });
  }, []);
  if (loginStatus === false) {
    console.log(loginStatus);
    return (<Redirect to="/" />);
  }
 
  const toQuote = () => {
    history.push('/quote');
  }
 
  const logout = () => {
    Axios.post('/api/logout', {
      action: 'logout'
    }).then((res) => {
      setLoginStatus(false);
    });
  }
 
  return (
    <div className="App">
      <header className="App-header">
      <button onClick={toQuote}>Quote, Buy, and Sell</button>
      <button onClick={logout}>Log Out</button>
      </header>
 
      <body>
        <ul>{portfolioItems}</ul>
      </body>
    </div>
  );
}
 
export default Account;
