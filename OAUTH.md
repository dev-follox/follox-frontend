## Frontend Integration

Your frontend should redirect users to these endpoints:
- For bloggers: `/auth/google/login?user_type=blogger`
- For shops: `/auth/google/login?user_type=shop`

The callback will return a JSON response with the JWT token that your frontend can use for authentication:

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "shop_id": 1,
  "blogger_id": null,
  "email": "user@example.com",
  "name": "User Name",
  "role": "SHOP",
  "is_new_user": false
}