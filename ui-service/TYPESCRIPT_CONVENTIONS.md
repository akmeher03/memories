# TypeScript Naming Conventions & Best Practices

## 📂 File Naming Conventions

### **1. Type Definition Files: `.types.ts`**

✅ **Recommended for this project:**
```
auth.types.ts       // Authentication types
user.types.ts       // User types
diary.types.ts      // Diary entry types
api.types.ts        // Generic API types
```

**Why use `.types.ts`?**
- **Clear purpose**: Immediately identifies files containing only type definitions
- **Easy search**: Quick to find all type files in IDE
- **Organized**: Separates types from business logic
- **Convention**: Widely used in modern TypeScript projects

**Alternative naming patterns:**
```
auth.model.ts       // ✅ Also good - indicates data models
auth.interface.ts   // ⚠️ Less common but valid
auth.d.ts           // ❌ Only for declaration files (no imports/exports)
AuthTypes.ts        // ❌ Avoid PascalCase for files
```

### **2. Service Files: `.service.ts`**

```
auth.service.ts     // Authentication API calls
user.service.ts     // User management API calls
storage.service.ts  // Local storage utilities
```

### **3. Other Common Patterns**

```
auth.config.ts      // Configuration
auth.utils.ts       // Utility functions
auth.test.ts        // Unit tests
auth.spec.ts        // Test specifications
auth.constants.ts   // Constants
auth.hooks.ts       // React hooks (or useAuth.ts)
```

## 🔤 Naming Conventions Summary

| Type | Naming Convention | Example |
|------|------------------|---------|
| **Files** | kebab-case | `auth.service.ts` |
| **Interfaces** | PascalCase | `SignUpRequest` |
| **Types** | PascalCase | `AuthResponse` |
| **Classes** | PascalCase | `AuthService` |
| **Functions** | camelCase | `signUp()` |
| **Variables** | camelCase | `authToken` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL` |
| **React Components** | PascalCase | `SignUp.tsx` |
| **CSS Files** | kebab-case | `sign-up.css` |

## 🎯 Export vs. No Export

### **When to use `export`:**

✅ **ALWAYS export** when code needs to be used in other files:

```typescript
// ✅ Exported - can be imported elsewhere
export interface SignUpRequest {
  email: string
  password: string
}

export class AuthService {
  // ...
}

export const API_URL = 'http://localhost:8080'
```

**Usage in another file:**
```typescript
import { SignUpRequest, AuthService, API_URL } from './auth'
```

### **When NOT to export:**

❌ **Don't export** if it's only used within the same file:

```typescript
// ❌ No export - internal helper only
interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Used only in this file
function validateEmail(email: string): ValidationResult {
  // ...
}

// ✅ Export the main function that uses the helper
export function signUp(data: SignUpRequest) {
  const validation = validateEmail(data.email)
  // ...
}
```

## 🏗️ Interface vs. Type

### **Use `interface` when:**

✅ Defining object shapes (most common):
```typescript
export interface User {
  id: string
  email: string
  name: string
}
```

✅ When you might extend it later:
```typescript
export interface AdminUser extends User {
  permissions: string[]
}
```

### **Use `type` when:**

✅ Union types:
```typescript
export type Status = 'pending' | 'success' | 'error'
```

✅ Intersection types:
```typescript
export type UserWithProfile = User & Profile
```

✅ Function types:
```typescript
export type AuthCallback = (user: User) => void
```

✅ Mapped types:
```typescript
export type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}
```

### **In Practice:**

For this project, we use `interface` for all data models because:
- Simpler syntax for object types
- Better error messages
- Can be extended easily
- Performance is identical

```typescript
// ✅ Our approach
export interface SignUpRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

// ⚠️ Also works, but less common for simple objects
export type SignUpRequest = {
  firstName: string
  lastName: string
  email: string
  password: string
}
```

## 📦 Module Organization

### **Recommended Structure:**

```
src/
├── models/              # Type definitions
│   ├── auth.types.ts   # Auth-related types
│   ├── user.types.ts   # User-related types
│   └── api.types.ts    # Generic API types
│
├── services/            # Business logic & API calls
│   ├── api.config.ts   # Axios configuration
│   ├── auth.service.ts # Auth API methods
│   └── user.service.ts # User API methods
│
├── utils/               # Helper functions
│   ├── validation.ts
│   └── formatting.ts
│
├── hooks/               # React hooks
│   ├── useAuth.ts
│   └── useUser.ts
│
└── pages/               # React components
    ├── SignUp.tsx
    └── SignIn.tsx
```

## 🎓 Why These Conventions?

### **1. Consistency**
- Team members know where to find things
- Reduces decision fatigue
- Makes code reviews easier

### **2. Scalability**
- Easy to add new features
- Clear separation of concerns
- Maintainable as project grows

### **3. IDE Support**
- Better autocomplete
- Easier navigation
- Quick file search

### **4. Industry Standard**
- Follows TypeScript best practices
- Similar to popular frameworks (Angular, NestJS)
- Easy for new developers to understand

## 📝 Real Example from Our Project

```typescript
// ============================================
// File: src/models/auth.types.ts
// Purpose: Type definitions only
// ============================================

// ✅ Exported - used in services and components
export interface SignUpRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface AuthResponse {
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
}

// ============================================
// File: src/services/auth.service.ts
// Purpose: Business logic
// ============================================

import type { SignUpRequest, AuthResponse } from '../models/auth.types'

class AuthService {
  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    // Implementation
  }
}

export const authService = new AuthService()

// ============================================
// File: src/pages/SignUp.tsx
// Purpose: UI Component
// ============================================

import { authService } from '../services/auth.service'
import type { SignUpRequest } from '../models/auth.types'

function SignUp() {
  const handleSubmit = async (data: SignUpRequest) => {
    await authService.signUp(data)
  }
  // ...
}
```

## 🚀 Quick Reference

**Importing types (type-only import):**
```typescript
import type { SignUpRequest } from './models/auth.types'
```

**Importing classes/functions:**
```typescript
import { authService } from './services/auth.service'
```

**Both in one line:**
```typescript
import { authService } from './services/auth.service'
import type { SignUpRequest } from './models/auth.types'
```

## 💡 Pro Tips

1. **Use type-only imports** when possible:
   ```typescript
   import type { User } from './types'  // ✅ Better
   import { User } from './types'       // ⚠️ Works but less clear
   ```

2. **Group related types** in the same file:
   ```typescript
   // auth.types.ts - all auth-related types together
   export interface SignUpRequest { }
   export interface SignInRequest { }
   export interface AuthResponse { }
   ```

3. **Document complex types** with JSDoc comments:
   ```typescript
   /**
    * Response from authentication endpoints
    * @property success - Whether the request was successful
    * @property data - User data and tokens (only on success)
    */
   export interface AuthResponse {
     success: boolean
     data?: UserData
   }
   ```

4. **Use optional properties** (`?`) wisely:
   ```typescript
   export interface User {
     id: string          // ✅ Required
     email: string       // ✅ Required
     lastName?: string   // ✅ Optional
   }
   ```

This approach keeps your codebase clean, organized, and easy to maintain! 🎉
