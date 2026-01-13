import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Spinner from '../components/Spinner';
import { useTranslation } from '../hooks/useTranslation';

const AuthCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent duplicate execution (React StrictMode runs effects twice in dev)
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Check for OAuth errors from Google
        const error = searchParams.get('error');
        if (error) {
          console.error('OAuth error from Google:', error);
          const errorDescription = searchParams.get('error_description') || t('authCallback.error', { message: error });
          
          // Log redirect_uri mismatch details if that's the error
          if (error === 'redirect_uri_mismatch') {
            const storedRedirectUri = sessionStorage.getItem('oauth_redirect_uri');
            console.error('Redirect URI mismatch error:', {
              error,
              errorDescription,
              storedRedirectUri,
              currentOrigin: window.location.origin,
              expectedRedirectUri: `${window.location.origin}/auth/callback`,
              message: 'The redirect URI sent to Google does not match what is registered in Google Cloud Console. Please check the backend FRONTEND_URL environment variable.',
            });
          }
          
          // Clean up sessionStorage
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('oauth_redirect_uri');
          sessionStorage.removeItem('oauth_user_type');
          navigate('/', { replace: true });
          return;
        }

        // Extract code and state from query parameters
        const code = searchParams.get('code');
        const returnedState = searchParams.get('state');
        
        console.log('OAuth callback received');
        console.log('Code present:', !!code);
        console.log('State present:', !!returnedState);
        
        if (!code || !returnedState) {
          console.error('Missing code or state in callback URL');
          navigate('/', { replace: true });
          return;
        }

        // Validate state
        const storedState = sessionStorage.getItem('oauth_state');
        const storedRedirectUri = sessionStorage.getItem('oauth_redirect_uri');
        const storedUserType = sessionStorage.getItem('oauth_user_type') as 'shop' | 'blogger' | null;
        
        // Log state values for debugging
        console.log('State validation:', {
          returnedState,
          storedState,
          match: returnedState === storedState,
          returnedLength: returnedState?.length,
          storedLength: storedState?.length,
        });
        
        // Check if returned state starts with stored state (might have :shop or :blogger suffix)
        // Or if stored state is the base of returned state
        const stateMatches = returnedState === storedState || 
                            returnedState?.startsWith(storedState + ':') ||
                            storedState === returnedState?.split(':')[0];
        
        if (!stateMatches) {
          console.error('Invalid state parameter. Possible CSRF attack.', {
            returnedState,
            storedState,
            returnedStateBase: returnedState?.split(':')[0],
            storedStateBase: storedState?.split(':')[0],
          });
          sessionStorage.removeItem('oauth_state');
          sessionStorage.removeItem('oauth_redirect_uri');
          sessionStorage.removeItem('oauth_user_type');
          navigate('/', { replace: true });
          return;
        }
        
        // Extract the base state (without suffix) for exchange
        // The backend stores and expects the base state, not the full state with :shop/:blogger suffix
        // Google returns the state with suffix, but backend validation uses the base state
        const stateToUse = returnedState?.split(':')[0] || returnedState;
        
        console.log('State to use for exchange:', {
          stateToUse,
          returnedState,
          storedState,
          baseState: returnedState?.split(':')[0],
          hasSuffix: returnedState?.includes(':'),
        });

        if (!storedRedirectUri || !storedUserType) {
          console.error('Missing stored redirect_uri or user_type');
          navigate('/', { replace: true });
          return;
        }

        // Exchange code with backend
        console.log('Exchanging code with backend...');
        console.log('Request payload:', {
          code: code?.substring(0, 20) + '...', // Log partial code for security
          state: stateToUse,
          redirect_uri: storedRedirectUri,
          user_type: storedUserType,
        });
        
        const tokenData = await api.exchangeGoogleCode({
          code,
          state: stateToUse,
          redirect_uri: storedRedirectUri,
          user_type: storedUserType,
        });

        console.log('Token exchange successful', { 
          hasToken: !!tokenData.access_token,
          role: tokenData.role,
          email: tokenData.email 
        });

        // Clean up sessionStorage
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_redirect_uri');
        sessionStorage.removeItem('oauth_user_type');

        // Create Google OAuth response object
        const googleResponse = {
          access_token: tokenData.access_token,
          token_type: tokenData.token_type || 'bearer',
          shop_id: tokenData.shop_id || null,
          blogger_id: tokenData.blogger_id || null,
          email: tokenData.email,
          name: tokenData.name,
          role: tokenData.role,
          is_new_user: false, // Backend doesn't return this in TokenResponse, but we can infer if needed
        };

        console.log('Calling loginWithGoogle with:', {
          role: googleResponse.role,
          shop_id: googleResponse.shop_id,
          blogger_id: googleResponse.blogger_id,
          email: googleResponse.email,
        });
        
        // Login with Google
        await loginWithGoogle(googleResponse);
        console.log('loginWithGoogle completed successfully');
        
        // Navigation is handled inside loginWithGoogle
      } catch (error: any) {
        console.error('Failed to process OAuth callback:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          response: error?.response?.data,
        });
        
        // Clean up sessionStorage on error
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_redirect_uri');
        sessionStorage.removeItem('oauth_user_type');
        
        // Show error to user before redirecting
        alert(t('authCallback.error', { message: error?.message || t('authCallback.unknownError') }));
        navigate('/', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, loginWithGoogle, navigate]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <Spinner size="large" />
        <p className="mt-4 text-gray-600">{t('authCallback.processing')}</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
