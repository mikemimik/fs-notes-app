import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// import { Auth0Provider } from '@auth0/auth0-react';

ReactDOM.render(<App />, document.getElementById('root'));

// Auth0 OAuth Example
// ReactDOM.render(
//   <Auth0Provider
//     domain="dev-demo-mcp1.us.auth0.com"
//     clientId="3RYg29UwRSUICS7Jp390vWnTCgNQtf6d"
//     redirectUri={window.location.origin}
//   >
//     <App />
//   </Auth0Provider>,
//   document.getElementById('root')
// );
