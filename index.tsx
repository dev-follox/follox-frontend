
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';

// Handle OAuth callback redirects from backend
// If backend redirects to /auth/callback (without hash), redirect to hash route
// This runs before React loads to catch the redirect immediately
if (window.location.pathname === '/auth/callback' && !window.location.hash) {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    // Use replace to avoid adding to history
    window.location.replace(`/#/auth/callback?token=${encodeURIComponent(token)}`);
  } else {
    // No token, redirect to home
    window.location.replace('/#/');
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
