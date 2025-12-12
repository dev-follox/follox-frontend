
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';

// Handle OAuth callback redirects from backend
// If backend redirects to /auth/callback (without hash), redirect to hash route
if (window.location.pathname === '/auth/callback') {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    // Redirect to hash route with token
    window.location.href = `/#/auth/callback?token=${encodeURIComponent(token)}`;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
