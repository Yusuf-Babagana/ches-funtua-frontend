# Django Rest Framework (DRF) Integration Guide

This frontend application is designed to work seamlessly with a Django Rest Framework backend. 
Currently, it runs in **MOCK_MODE** (frontend-only), but it uses a structured API client that mirrors typical DRF endpoints.

## 1. Configuration

To connect to your real backend, you simply need to change the configuration in `lib/api.ts`:

1. Open `lib/api.ts`
2. Set `MOCK_MODE = false`
3. Set `API_URL` to your Django server address (e.g., `http://localhost:8000/api`)

Alternatively, you can use Environment Variables:
\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MOCK_MODE=false
\`\`\`

## 2. Expected Backend Endpoints

Your DRF backend should expose the following endpoints to match the frontend client:

### Authentication (JWT)
- **POST** `/auth/login/`
  - Input: `{ "email": "...", "password": "..." }`
  - Output: `{ "access": "...", "refresh": "...", "user": { ... } }`

- **POST** `/auth/refresh/`
  - Input: `{ "refresh": "..." }`
  - Output: `{ "access": "..." }`

- **POST** `/auth/register/`
  - Input: `{ "email": "...", "password": "...", "full_name": "...", ... }`
  - Output: `{ "user": { ... }, "access": "...", "refresh": "..." }`

### Users
- **GET** `/users/me/`
  - Headers: `Authorization: Bearer <token>`
  - Output: User profile object

## 3. Handling CORS

Ensure your Django settings allow requests from this frontend:

\`\`\`python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-vercel-app.vercel.app",
]
\`\`\`

## 4. Token Authentication

The frontend uses `localStorage` to store the `accessToken`. The `apiClient` in `lib/api.ts` automatically attaches this token to every request header:

\`\`\`javascript
config.headers.Authorization = `Bearer ${token}`
\`\`\`

If your DRF uses `Token` instead of `Bearer`, update line 38 in `lib/api.ts`.
