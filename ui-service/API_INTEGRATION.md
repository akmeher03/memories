# Authentication API Integration

This document explains how the authentication system works in the frontend.

## 📁 Project Structure

```
src/
├── models/
│   └── auth.types.ts          # TypeScript types for authentication
├── services/
│   ├── api.config.ts          # Axios client configuration
│   └── auth.service.ts        # Authentication API methods
└── pages/
    ├── SignUp.tsx             # Sign up page with API integration
    └── SignIn.tsx             # Sign in page with API integration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_ENV=development
```

## 📝 Type Definitions

### Request Models

```typescript
interface SignUpRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface SignInRequest {
  email: string
  password: string
}
```

### Response Models

```typescript
interface AuthResponse {
  success: boolean
  message: string
  data?: {
    userId: string
    email: string
    firstName?: string
    lastName?: string
    token: string
    refreshToken?: string
  }
  error?: string
}
```

## 🚀 API Service Methods

### Sign Up

```typescript
const response = await authService.signUp({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "password123"
})
```

### Sign In

```typescript
const response = await authService.signIn({
  email: "john@example.com",
  password: "password123"
})
```

### Sign Out

```typescript
await authService.signOut()
```

### Refresh Token

```typescript
const response = await authService.refreshToken()
```

### Check Authentication

```typescript
const isAuth = authService.isAuthenticated()
```

## 🔐 Token Management

### Automatic Token Storage

When a user signs in or signs up successfully, the authentication token is automatically stored in `localStorage`:

- **authToken**: JWT access token
- **refreshToken**: Refresh token for renewing access

### Automatic Token Injection

The axios client automatically adds the auth token to all requests:

```javascript
headers: {
  Authorization: `Bearer ${token}`
}
```

### Token Expiration Handling

When a 401 (Unauthorized) response is received:
1. Tokens are cleared from localStorage
2. User is redirected to `/signin`

## 📡 Backend API Endpoints Expected

Your backend should implement these endpoints:

### POST `/api/auth/signup`
**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "userId": "user123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST `/api/auth/signin`
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "user123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST `/api/auth/signout`
**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST `/api/auth/refresh`
**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## 🎨 Frontend Integration

### Sign Up Page (`/signup`)

- Collects: First Name, Last Name, Email, Password, Confirm Password
- Validates form inputs
- Sends POST request to `/api/auth/signup`
- On success: Shows alert and redirects to `/signin`
- On error: Displays error message

### Sign In Page (`/signin`)

- Collects: Email, Password
- Validates form inputs
- Sends POST request to `/api/auth/signin`
- On success: Shows alert and redirects to `/writings`
- On error: Displays error message

### Loading States

Both pages show loading indicators:
- Sign Up: "Creating Account..."
- Sign In: "Signing In..."
- Buttons are disabled during loading

### Error Handling

Errors are displayed in a red alert box above the form:
```tsx
{apiError && (
  <div className="alert alert-error">
    {apiError}
  </div>
)}
```

## 🛠️ Usage Example

### In a Component

```typescript
import { authService } from '../services/auth.service'

// Sign up
const handleSignUp = async () => {
  try {
    const response = await authService.signUp({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123"
    })
    
    if (response.success) {
      console.log("Signed up!", response.data)
    }
  } catch (error) {
    console.error("Sign up failed", error)
  }
}

// Check if authenticated
if (authService.isAuthenticated()) {
  // User is logged in
}
```

## 🔄 Token Refresh Flow

1. Access token expires (401 response)
2. Axios interceptor catches error
3. Calls `authService.refreshToken()`
4. Stores new tokens
5. Retries original request
6. If refresh fails, redirects to login

## 🧪 Testing Without Backend

For testing without a backend, you can:

1. Use a mock API service (JSON Server, MSW)
2. Update `api.config.ts` to point to a mock endpoint
3. Or temporarily modify the service to return mock data

## 📦 Dependencies

- `axios`: HTTP client for API calls
- `react-router-dom`: Navigation and routing

## 🚨 Important Notes

1. **CORS**: Ensure your backend allows requests from your frontend origin
2. **HTTPS**: Use HTTPS in production for secure token transmission
3. **Token Storage**: Consider using `httpOnly` cookies for enhanced security
4. **Error Messages**: Customize error messages based on your backend responses

## 🔐 Security Best Practices

1. ✅ Tokens stored in localStorage (easy to implement)
2. ✅ Automatic token injection in requests
3. ✅ Automatic logout on 401 errors
4. ✅ Password validation (min 6 characters)
5. ✅ Email format validation
6. ⚠️ Consider using httpOnly cookies for production
7. ⚠️ Implement rate limiting on backend
8. ⚠️ Add CAPTCHA for production

