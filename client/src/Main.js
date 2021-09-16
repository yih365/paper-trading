import React from "react";
import "./App.css";
import Axios from 'axios';
import { useHistory, Link } from "react-router-dom";

function Main() {
  const history = useHistory();
  console.log(useHistory);

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [usernameReg, setUsernameReg] = React.useState("");
  const [passwordReg, setPasswordReg] = React.useState("");
  const [loginStatus, setLoginStatus] = React.useState(false);
  const [loginText, setLoginText] = React.useState("");

  React.useEffect(() => {
    Axios.get('/api').then((response) => {
      if (response.data.loggedIn === true) {
        setLoginStatus(true);
      };
      console.log(response);
    });
  }, []);

  const login = () => {
    Axios.post('/api', {
      username: username,
      password: password,
      action: "login"
      }).then((res) => {
        if (res.data.auth === true) {
          setLoginStatus(true);
          history.push('/account');
        } else {
          if (res.data.message) {
            setLoginText(res.data.message);
            setLoginStatus(false);
          }
        }
      });
  };

  if (loginStatus === true) history.push('/account');

  const register = () => {
    Axios.post('/api', {
      username: usernameReg,
      password: passwordReg,
      action: "register"
    }).then((res) => {
      if (res.data.message) {
        console.log('message exists');
        console.log(res.data.message);
        setLoginText(res.data.message);
        console.log('loginText is ' + loginText);
      }
    });
  };

  return (
    
    <div className="App">
      <header className="App-header">
        Login or Register
      </header>

      <div className="Login">
        <h1>Login</h1>
              <label>Username</label>
              <input
                  type="text"
                  onChange={(e) => {
                      setUsername(e.target.value);
                  }}
              />
              <br/>
              <label>Password</label>
              <input
                  type="text"
                  onChange={(e) => {
                      setPassword(e.target.value);
                  }}
              />
              <br/>
              <button onClick={login}>Login</button>
      </div>

      <div className="Register">
        <h1>Register</h1>
              <label>Username</label>
              <input
                  type="text"
                  onChange={(e) => {
                      setUsernameReg(e.target.value);
                  }}
              />
              <br/>
              <label>Password</label>
              <input
                  type="text"
                  onChange={(e) => {
                      setPasswordReg(e.target.value);
                  }}
              />
              <br/>
              <button onClick={register}>Register</button>
      </div>

      <h1>{loginText}</h1>
    </div>
  );
}

export default Main;
