import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';

import { getToken } from './utils/token';
import Login from './components/Login';
import Main from './components/Main';
import SignUp from './components/SignUp';

function App() {
  const [ user, updateUser ] = useState(undefined);
  async function getUser() {
    try {
      const token = getToken();
      const response = await fetch('/api/users/me', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      updateUser(data.data);
    } catch (err) {
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
          <Route exact path="/login" render={(props) => {
            if (user) {
              return <Redirect to="/" />
            }

            return <Login getUser={getUser} {...props} />
          }} />
          <Route exact path="/signup" component={SignUp} />
          <Route path="/" render={(props) => {
            if (!user) {
              return <Redirect to="/login" />;
            }

            return <Main {...props} />;
          }} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;