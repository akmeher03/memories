# Complete Flow of Spring Security and JWT Token Authentication

## Overview

Your application uses **Spring Security** with **JWT (JSON Web Token)** for stateless authentication. This means the server doesn't store session information - instead, each request carries a token that proves who the user is.

---

## 🏗️ Architecture Components

### 1. **SecurityConfig** - The Security Blueprint
This is the master configuration that defines:
- Which endpoints are public (no authentication needed)
- Which endpoints require authentication
- How the security filter chain works

### 2. **JwtAuthFilter** - The Security Guard
A filter that intercepts EVERY request and checks if there's a valid JWT token.

### 3. **JwtProvider** - The Token Factory
Creates, validates, and extracts information from JWT tokens.

### 4. **Controllers** - The Request Handlers
- **AuthController**: Handles login, register, logout, refresh
- **UserController**: Handles user-related operations (requires authentication)

### 5. **Services** - The Business Logic
- **AuthService**: Authentication logic
- **UserService**: User management logic

---

## 🔄 Complete Request Flow

### **SCENARIO 1: User Registration** `/auth/register` (Public Endpoint)

```
1. Client sends POST to /auth/register
   {
     "email": "user@example.com",
     "password": "password123",
     "firstName": "John",
     "lastName": "Doe"
   }

2. Request arrives at Spring Security Filter Chain
   ↓
3. JwtAuthFilter.shouldNotFilter() checks the path
   - Path starts with "/auth/" → Returns TRUE
   - Filter is SKIPPED (no JWT processing needed)
   ↓
4. Spring Security checks authorization rules (SecurityConfig)
   - .requestMatchers("/auth/**").permitAll()
   - Request is ALLOWED without authentication
   ↓
5. Request reaches AuthController.register()
   ↓
6. AuthService.registerUser() is called
   - Checks if email already exists
   - Hashes the password using BCryptPasswordEncoder
   - Creates new User entity
   - Saves to database
   ↓
7. Response: "User registered successfully"
```

**Key Points:**
- Password is **never stored in plain text** - it's hashed using BCrypt
- No JWT token is generated during registration
- Public endpoint - no authentication required

---

### **SCENARIO 2: User Login** `/auth/login` (Public Endpoint)

```
1. Client sends POST to /auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }

2. Request arrives at Spring Security Filter Chain
   ↓
3. JwtAuthFilter.shouldNotFilter() checks the path
   - Path starts with "/auth/" → Returns TRUE
   - Filter is SKIPPED
   ↓
4. Spring Security allows the request (permitAll)
   ↓
5. Request reaches AuthController.login()
   ↓
6. AuthService.login() is called:
   
   a) Find user by email:
      User user = userRepository.findByEmailAndDeletedFalse(email)
   
   b) Verify password:
      passwordEncoder.matches(plainPassword, hashedPassword)
      → Compares the provided password with the stored hash
   
   c) Generate Access Token (JwtProvider.generateAccessToken()):
      - Creates JWT with:
        * Subject: user's email
        * Issued At: current timestamp
        * Expiration: current time + 15 minutes
        * Signed with: HS256 algorithm + secret key
      
      Example JWT structure:
      Header:  {"alg": "HS256", "typ": "JWT"}
      Payload: {"sub": "user@example.com", "iat": 1699612800, "exp": 1699613700}
      Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
   
   d) Create Refresh Token:
      - Generates a random UUID
      - Valid for 7 days
      - Saved in database
   
   e) Return JwtResponse:
      {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
      }
```

**Key Points:**
- **Access Token** (JWT): Short-lived (15 min), contains user identity, sent with every request
- **Refresh Token**: Long-lived (7 days), stored in DB, used to get new access tokens
- Client must store both tokens (typically in localStorage or memory)

---

### **SCENARIO 3: Accessing Protected Endpoint** `/user/me` (Requires Authentication)

```
1. Client sends GET to /user/me with header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. Request arrives at Spring Security Filter Chain
   ↓
3. JwtAuthFilter.shouldNotFilter() checks the path
   - Path is "/user/me"
   - Does NOT start with "/auth/", "/swagger-ui", etc.
   - Returns FALSE → Filter WILL RUN
   ↓
4. JwtAuthFilter.doFilterInternal() executes:

   Step 4a: Extract token from header
   ───────────────────────────────────
   String header = request.getHeader("Authorization");
   // header = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   
   if (header != null && header.startsWith("Bearer ")) {
       token = header.substring(7);  // Remove "Bearer " prefix
   }

   Step 4b: Validate and extract email from token
   ───────────────────────────────────────────────
   if (jwtProvider.validateToken(token)) {
       // Validates:
       // - Token signature is correct (not tampered)
       // - Token is not expired
       
       email = jwtProvider.getEmailFromToken(token);
       // Extracts "sub" (subject) claim from JWT payload
       // email = "user@example.com"
   }

   Step 4c: Load user from database
   ─────────────────────────────────
   User user = userRepository.findByEmailAndDeletedFalse(email);
   // Fetches the full User entity from database

   Step 4d: Create Authentication object
   ──────────────────────────────────────
   UsernamePasswordAuthenticationToken authToken = 
       new UsernamePasswordAuthenticationToken(
           user.getEmail(),    // Principal (who is the user)
           null,               // Credentials (not needed - already authenticated)
           null                // Authorities/Roles (can add later)
       );

   Step 4e: Store in SecurityContext
   ──────────────────────────────────
   SecurityContextHolder.getContext().setAuthentication(authToken);
   // This tells Spring Security: "This request is authenticated"
   // Any code can now access the authenticated user

   ↓
5. Request continues through filter chain
   ↓
6. Spring Security checks authorization rules:
   - .anyRequest().authenticated()
   - SecurityContext HAS authentication → ALLOWED
   ↓
7. Request reaches UserController.getCurrentUser()
   ↓
8. UserService.getCurrentUser() is called:
   
   // Get email from SecurityContext (set by JwtAuthFilter)
   String email = SecurityContextHolder.getContext()
                    .getAuthentication()
                    .getName();
   
   // Fetch user from database
   User user = userRepository.findByEmailAndDeletedFalse(email);
   
   ↓
9. Response: User object (JSON)
   {
     "id": "123e4567-e89b-12d3-a456-426614174000",
     "email": "user@example.com",
     "firstName": "John",
     "lastName": "Doe",
     "createdAt": "2025-11-10T10:30:00Z"
   }
```

**Key Points:**
- JWT token is validated on EVERY protected request
- User information is extracted from the token and database
- SecurityContext holds the authentication state for the current request
- After the request completes, SecurityContext is cleared (stateless)

---

### **SCENARIO 4: Token Expired - Refresh Flow** `/auth/refresh`

```
1. Access token expires after 15 minutes
   ↓
2. Client tries to access /user/me with expired token
   ↓
3. JwtAuthFilter validates token → FAILS (expired)
   ↓
4. No authentication is set in SecurityContext
   ↓
5. Spring Security blocks the request → 403 Forbidden
   ↓
6. Client detects error and sends POST to /auth/refresh
   {
     "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
   }
   ↓
7. AuthService.refreshToken() is called:
   
   a) Find refresh token in database
   b) Validate:
      - Token exists
      - Not revoked
      - Not expired (< 7 days old)
   c) Generate NEW access token
   d) Return JwtResponse with new access token
   
   ↓
8. Client uses the new access token for subsequent requests
```

**Key Points:**
- Access tokens are short-lived for security
- Refresh tokens are long-lived for convenience
- Refresh tokens can be revoked (logout)

---

### **SCENARIO 5: Logout** `/auth/logout`

```
1. Client sends POST to /auth/logout
   {
     "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
   }
   ↓
2. AuthService.logout() is called:
   
   a) Find refresh token in database
   b) Mark as revoked:
      token.setRevoked(true);
   c) Save to database
   
   ↓
3. Response: "Logged out successfully"
   ↓
4. Client deletes stored tokens
```

**Key Points:**
- Logout revokes the refresh token in the database
- Access tokens can't be revoked (they expire naturally)
- Client must delete tokens from storage

---

## 🔐 Security Components Deep Dive

### **1. SecurityConfig - The Master Plan**

```java
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            // 1. DISABLE CSRF
            .csrf(csrf -> csrf.disable())
            // CSRF protection not needed for stateless JWT APIs
            
            // 2. STATELESS SESSION
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Don't create HTTP sessions - use JWT instead
            
            // 3. AUTHORIZATION RULES
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**", "/swagger-ui/**").permitAll()
                // Public endpoints - anyone can access
                
                .anyRequest().authenticated()
                // All other endpoints require authentication
            )
            
            // 4. ADD JWT FILTER
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            // Run JwtAuthFilter BEFORE Spring's default authentication filter
            
        return http.build();
    }
}
```

**What it does:**
- Configures Spring Security to work in stateless mode (no sessions)
- Defines which endpoints are public vs. protected
- Adds custom JWT filter to the security chain

---

### **2. JwtAuthFilter - The Gatekeeper**

```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    // OncePerRequestFilter = runs once per request
    
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip filter for public endpoints (performance optimization)
        return path.startsWith("/auth/") || 
               path.startsWith("/swagger-ui");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        // 1. Extract JWT from Authorization header
        String token = extractToken(request);
        
        // 2. Validate JWT and get user email
        String email = validateAndGetEmail(token);
        
        // 3. Load user from database
        User user = userRepository.findByEmailAndDeletedFalse(email);
        
        // 4. Create authentication object
        UsernamePasswordAuthenticationToken authToken = 
            new UsernamePasswordAuthenticationToken(user.getEmail(), null, null);
        
        // 5. Store in SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authToken);
        
        // 6. Continue to next filter
        filterChain.doFilter(request, response);
    }
}
```

**What it does:**
- Extracts JWT token from the `Authorization: Bearer <token>` header
- Validates the token (signature, expiration)
- Loads the user from the database
- Sets authentication in SecurityContext
- Allows the request to proceed

---

### **3. JwtProvider - Token Operations**

```java
@Component
public class JwtProvider {
    private final String jwtSecret = "your-256-bit-secret-key";
    private final long jwtExpirationMs = 15 * 60 * 1000; // 15 minutes

    // CREATE TOKEN
    public String generateAccessToken(User user) {
        return Jwts.builder()
            .setSubject(user.getEmail())           // Who the token is for
            .setIssuedAt(new Date())               // When it was created
            .setExpiration(new Date(now + 15min))  // When it expires
            .signWith(HS256, jwtSecret)            // Sign with secret key
            .compact();                             // Convert to string
    }

    // READ TOKEN
    public String getEmailFromToken(String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)  // Use same secret to verify
            .parseClaimsJws(token)     // Parse and verify signature
            .getBody()                  // Get payload
            .getSubject();             // Get "sub" claim (email)
    }

    // VALIDATE TOKEN
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token);
            return true;  // Valid if no exception thrown
        } catch (JwtException e) {
            return false; // Invalid token
        }
    }
}
```

**What it does:**
- **generateAccessToken()**: Creates a JWT with user email, timestamps, and signature
- **getEmailFromToken()**: Extracts the email from a valid JWT
- **validateToken()**: Checks if JWT is valid (correct signature, not expired)

---

## 🎯 Key Concepts Explained

### **What is JWT?**
A JWT is a string with three parts separated by dots:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Part 1 (Header):    {"alg": "HS256", "typ": "JWT"}
Part 2 (Payload):   {"sub": "user@example.com", "iat": 1699612800, "exp": 1699613700}
Part 3 (Signature): HMACSHA256(base64(header) + "." + base64(payload), secret)
```

### **Why JWT instead of Sessions?**
- **Stateless**: Server doesn't need to store session data
- **Scalable**: Works across multiple servers
- **Mobile-friendly**: Easy to use in mobile apps
- **Microservices**: Can be shared across different services

### **SecurityContext vs Session**
- **Session (Traditional)**: Server stores user data in memory/database
- **SecurityContext (JWT)**: Stores authentication only for the current request
- After request completes, SecurityContext is cleared
- Next request must provide JWT again

### **Filter Chain Order**
```
Request
  ↓
1. JwtAuthFilter (your custom filter)
  ↓
2. Spring Security's internal filters
  ↓
3. Authorization checks
  ↓
4. Controller
```

---

## 🚨 Security Best Practices in Your Code

### ✅ **Good Practices You're Using:**

1. **Password Hashing**: Using BCrypt to hash passwords
   ```java
   passwordEncoder.encode(request.getPassword())
   ```

2. **Stateless Authentication**: No server-side sessions
   ```java
   .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   ```

3. **Token Expiration**: Access tokens expire in 15 minutes
   ```java
   private final long jwtExpirationMs = 15 * 60 * 1000;
   ```

4. **Refresh Token Revocation**: Can invalidate refresh tokens on logout
   ```java
   token.setRevoked(true);
   ```

5. **Soft Delete**: Users marked as deleted, not actually removed
   ```java
   findByEmailAndDeletedFalse(email)
   ```

### ⚠️ **Security Improvements Needed:**

1. **JWT Secret in Code**: Move to environment variable
   ```java
   // Bad (current):
   private final String jwtSecret = "hardcoded-secret";
   
   // Good:
   private final String jwtSecret = System.getenv("JWT_SECRET");
   ```

2. **Add Token Blacklist**: For revoking access tokens before expiration

3. **Add Roles/Authorities**: For fine-grained permissions
   ```java
   // Future enhancement:
   .hasRole("ADMIN")
   ```

4. **Rate Limiting**: Prevent brute force attacks on login

5. **HTTPS Only**: Ensure tokens are never sent over HTTP

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                        │
│  (Browser, Mobile App, etc.)                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Request
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     SPRING SECURITY FILTER CHAIN                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 1: JwtAuthFilter                                     │ │
│  │  • Check if public endpoint → Skip if yes                  │ │
│  │  • Extract JWT from Authorization header                   │ │
│  │  • Validate JWT (signature, expiration)                    │ │
│  │  • Load user from database                                 │ │
│  │  • Set authentication in SecurityContext                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 2: Spring Security Authorization                     │ │
│  │  • Check if endpoint requires authentication               │ │
│  │  • Check if SecurityContext has authentication             │ │
│  │  • Allow or Deny request                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         CONTROLLER LAYER                         │
│  • AuthController (/auth/*)                                     │
│  • UserController (/user/*)                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                            │
│  • AuthService: login, register, refresh, logout               │
│  • UserService: getCurrentUser, getUserById                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       REPOSITORY LAYER                           │
│  • UserRepository                                               │
│  • RefreshTokenRepository                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                          DATABASE                                │
│  • users table                                                  │
│  • refresh_tokens table                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Summary

Your authentication system works like this:

1. **Registration**: User creates account → Password is hashed and stored
2. **Login**: User provides credentials → Server generates JWT + Refresh Token
3. **API Requests**: Client sends JWT with each request → Server validates and authenticates
4. **Token Refresh**: When JWT expires → Use refresh token to get new JWT
5. **Logout**: Refresh token is revoked → User must login again

The beauty of JWT is that it's **stateless** - the server doesn't remember who's logged in. Each request proves its own identity with the JWT token. This makes your application scalable and easy to deploy across multiple servers.

---

## 🔍 Quick Reference

| Component | Purpose | When It Runs |
|-----------|---------|--------------|
| **SecurityConfig** | Defines security rules | Application startup |
| **JwtAuthFilter** | Validates JWT on each request | Every protected request |
| **JwtProvider** | Creates and validates JWTs | Login, Token validation |
| **AuthService** | Handles login/register/logout | Auth endpoints |
| **UserService** | Handles user operations | Protected user endpoints |
| **SecurityContext** | Stores current user for request | During request processing |

| Endpoint | Authentication Required | Purpose |
|----------|------------------------|---------|
| POST `/auth/register` | ❌ No | Create new account |
| POST `/auth/login` | ❌ No | Get JWT tokens |
| POST `/auth/refresh` | ❌ No | Refresh expired JWT |
| POST `/auth/logout` | ❌ No | Revoke refresh token |
| GET `/user/me` | ✅ Yes | Get current user info |
| GET `/user/{id}` | ✅ Yes | Get user by ID |

---

**This is a production-ready JWT authentication system with Spring Security!** 🎉

