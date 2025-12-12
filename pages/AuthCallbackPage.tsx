import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from query parameter (may be URL encoded)
        let token = searchParams.get('token');
        
        // Also try to get from window.location.search as fallback
        if (!token) {
          const urlParams = new URLSearchParams(window.location.search);
          token = urlParams.get('token');
        }
        
        console.log('Callback received');
        console.log('Location pathname:', location.pathname);
        console.log('Location search:', location.search);
        console.log('Window location:', window.location.href);
        console.log('Token present:', !!token);
        console.log('Search params:', Array.from(searchParams.entries()));
        
        if (!token) {
          console.error('No token found in callback URL');
          navigate('/', { replace: true });
          return;
        }

        // URL decode the token in case it's encoded
        token = decodeURIComponent(token);
        console.log('Token extracted (first 50 chars):', token.substring(0, 50));

        // Decode the base64 token
        let decodedData;
        try {
          // Check if token is a JWT (has dots separating parts)
          if (token.includes('.')) {
            // It's a JWT token - extract the payload (middle part)
            const parts = token.split('.');
            if (parts.length === 3) {
              // Decode the payload (second part)
              const payload = parts[1];
              // Handle base64url encoding
              const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
              const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
              const decodedString = atob(padded);
              decodedData = JSON.parse(decodedString);
              // For JWT, the access_token is the full JWT token
              decodedData.access_token = token;
              console.log('Decoded JWT payload:', decodedData);
            } else {
              throw new Error('Invalid JWT format');
            }
          } else {
            // It's a base64-encoded JSON string
            // Handle base64url encoding
            const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
            const decodedString = atob(padded);
            decodedData = JSON.parse(decodedString);
            console.log('Decoded base64 JSON:', decodedData);
          }
        } catch (decodeError) {
          console.error('Failed to decode token:', decodeError);
          console.error('Token value (first 100 chars):', token.substring(0, 100));
          // Try direct base64 decode as fallback
          try {
            const decodedString = atob(token);
            decodedData = JSON.parse(decodedString);
            console.log('Fallback decode successful');
          } catch (fallbackError) {
            console.error('Fallback decode also failed:', fallbackError);
            navigate('/', { replace: true });
            return;
          }
        }

        // Extract data from decoded token
        const {
          access_token,
          token_type,
          shop_id,
          blogger_id,
          email,
          name,
          role,
          is_new_user
        } = decodedData;

        console.log('Extracted fields:', { access_token: !!access_token, role, email, name });

        if (!access_token || !role || !email || !name) {
          console.error('Missing required fields in token:', {
            hasAccessToken: !!access_token,
            role,
            email,
            name
          });
          navigate('/', { replace: true });
          return;
        }

        // Create Google OAuth response object
        const googleResponse = {
          access_token,
          token_type: token_type || 'bearer',
          shop_id: shop_id ? parseInt(String(shop_id)) : null,
          blogger_id: blogger_id ? parseInt(String(blogger_id)) : null,
          email,
          name,
          role: role as 'SHOP' | 'BLOGGER',
          is_new_user: is_new_user || false,
        };

        console.log('Calling loginWithGoogle...');
        // Login with Google
        await loginWithGoogle(googleResponse);
        console.log('loginWithGoogle completed');
        
        // Navigation is handled inside loginWithGoogle
      } catch (error) {
        console.error('Failed to process OAuth callback:', error);
        console.error('Error details:', error);
        navigate('/', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, loginWithGoogle, navigate, location]);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <Spinner size="large" />
        <p className="mt-4 text-gray-600">Обработка входа...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
