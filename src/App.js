import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect
} from "react-router-dom";

import { getToken } from "./utils/token";
import Login from "./components/Login";
import Main from "./components/Main";
import SignUp from "./components/SignUp";

function App() {
  const [user, updateUser] = useState(undefined);
  async function getUser() {
    try {
      const token = getToken();
      console.log(token, 'token?');
      const response = await fetch("/api/users/me", {
        headers: {
          authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      console.log('how does this do stuff though?');
      updateUser(data.data);
    } catch (err) {
      console.log("error?");
      updateUser(undefined);
      console.log({ err });
    }
  }
  useEffect(() => {
    getUser();
  }, []);

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
              return <SignUp getUser={getUser} updateUser={updateUser} {...props} />;
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
