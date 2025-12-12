## Frontend-First OAuth Flow Implementation

### Backend Setup

The backend provides two endpoints for the frontend-first flow:

1. **`GET /auth/google/authorize-url?user_type=blogger`**
   - Returns Google OAuth authorization URL with frontend redirect URI
   - Response: `{ "authorization_url": "...", "state": "...", "redirect_uri": "..." }`

2. **`POST /auth/google/exchange`**
   - Accepts: `{ "code": "...", "state": "...", "redirect_uri": "...", "user_type": "blogger" }`
   - Returns: `{ "access_token": "...", "email": "...", "name": "...", "role": "...", ... }`

### Frontend Implementation

```javascript
// 1. Get authorization URL from backend
const response = await fetch('/auth/google/authorize-url?user_type=blogger');
const { authorization_url, state, redirect_uri } = await response.json();

// 2. Store state in sessionStorage for validation
sessionStorage.setItem('oauth_state', state);
sessionStorage.setItem('oauth_redirect_uri', redirect_uri);

// 3. Redirect user to Google
window.location.href = authorization_url;

// 4. After Google redirects back to /auth/callback, extract code
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const returnedState = urlParams.get('state');

// 5. Validate state and exchange code with backend
const storedState = sessionStorage.getItem('oauth_state');
if (returnedState !== storedState) {
  throw new Error('Invalid state parameter');
}

const exchangeResponse = await fetch('/auth/google/exchange', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: code,
    state: returnedState,
    redirect_uri: sessionStorage.getItem('oauth_redirect_uri'),
    user_type: 'blogger'
  })
});

const tokenData = await exchangeResponse.json();
// Store token and redirect to app
localStorage.setItem('access_token', tokenData.access_token);
// Navigate to your app...
```