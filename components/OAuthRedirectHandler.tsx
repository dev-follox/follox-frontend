import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Handles OAuth callback redirects from backend
 * If backend redirects to /auth/callback (without hash), redirects to hash route
 */
const OAuthRedirectHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if we're on /auth/callback without hash (from backend redirect)
    if (window.location.pathname === '/auth/callback' && !window.location.hash) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        // Redirect to hash route with token
        window.location.replace(`/#/auth/callback?token=${encodeURIComponent(token)}`);
      } else {
        // No token, redirect to home
        window.location.replace('/#/');
      }
    }
  }, [location]);

  return null;
};

export default OAuthRedirectHandler;

