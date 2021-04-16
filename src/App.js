import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect
} from "react-router-dom";

import Login from "./components/Login";
import Main from "./components/Main";
import SignUp from "./components/SignUp";

function App() {
  const [user, setUser] = useState(undefined);
  const [token, setToken] = useState(undefined);

  const getUser = async () => {
    try {
      const response = await fetch('/api/users/userinfo', {
        header: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('bad user fetch');
        setUser(undefined);
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error(err);
      setUser(undefined);
    }
  }

  return (
    <div className="App">
      <Router>
        <Switch>
          <Route
            exact
            path="/login"
            render={props => {
              if (user) {
                return <Redirect to="/" />;
              }

              return <Login getUser={getUser} {...props} />;
            }}
          />
          <Route
            exact
            path="/signup"
            render={props => {
              if (user) {
                return <Redirect to="/" />;
              }
              return <SignUp getUser={getUser} setToken={setToken} {...props} />;
            }}
          />
          <Route
            path="/"
            render={props => {
              if (!user) {
                return <Redirect to="/login" />;
              }

              return <Main {...props} />;
            }}
          />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
