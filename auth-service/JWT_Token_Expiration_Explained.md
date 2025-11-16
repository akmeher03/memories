# JWT Token Expiration - Complete Explanation

## ✅ Yes, JWT tokens WILL expire after 15 minutes!

Here's exactly how it works in your application:

---

## 📋 How JWT Expiration is Set

In your `JwtProvider.java`:

```java
private final long jwtExpirationMs = 15 * 60 * 1000; // 15 minutes = 900,000 milliseconds

public String generateAccessToken(User user) {
    return Jwts.builder()
        .setSubject(user.getEmail())
        .setIssuedAt(new Date())  // Current time: e.g., 10:00:00 AM
        .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))  // Expires at: 10:15:00 AM
        .signWith(SignatureAlgorithm.HS256, jwtSecret)
        .compact();
}
```

### What happens during token generation:

1. **User logs in at 10:00:00 AM**
2. **Token is created with:**
   - `iat` (Issued At): `1699612800` → 10:00:00 AM
   - `exp` (Expiration): `1699613700` → 10:15:00 AM (15 minutes later)

The JWT payload looks like:
```json
{
  "sub": "user@example.com",
  "iat": 1699612800,    // Issued at 10:00:00 AM
  "exp": 1699613700     // Expires at 10:15:00 AM
}
```

---

## ⏰ Timeline: What Happens After Login

```
Time: 10:00 AM
└─► User logs in
    └─► JWT token generated
        └─► Token contains: exp = 10:15 AM

Time: 10:05 AM (5 minutes later)
└─► User calls GET /user/me
    └─► JwtAuthFilter validates token
        └─► Check: Current time (10:05) < Expiration time (10:15)
        ✅ Token is VALID → Request succeeds

Time: 10:10 AM (10 minutes later)
└─► User calls GET /user/me
    └─► JwtAuthFilter validates token
        └─► Check: Current time (10:10) < Expiration time (10:15)
        ✅ Token is VALID → Request succeeds

Time: 10:15 AM (15 minutes later)
└─► User calls GET /user/me
    └─► JwtAuthFilter validates token
        └─► Check: Current time (10:15) >= Expiration time (10:15)
        ❌ Token is EXPIRED → Request FAILS

Time: 10:20 AM (20 minutes later)
└─► User calls GET /user/me
    └─► JwtAuthFilter validates token
        └─► Check: Current time (10:20) > Expiration time (10:15)
        ❌ Token is EXPIRED → Request FAILS
```

---

## 🔍 How Expiration is Validated

In your `JwtProvider.validateToken()` method:

```java
public boolean validateToken(String token) {
    try {
        Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token);  // ← This validates BOTH signature AND expiration
        return true;
    } catch (JwtException e) {  // ← Catches ExpiredJwtException
        return false;
    }
}
```

### What `parseClaimsJws()` does:

1. **Verifies the signature** - Ensures token wasn't tampered with
2. **Checks expiration** - Compares current time with `exp` claim
3. **Throws `ExpiredJwtException`** if current time > expiration time

---

## 🚫 What Happens When Token Expires

### Step-by-Step Flow:

```
1. Client sends request with EXPIRED token
   GET /user/me
   Authorization: Bearer <expired-jwt-token>

2. Request enters JwtAuthFilter.doFilterInternal()
   ↓
3. Extract token from header:
   token = "expired-jwt-token"
   ↓
4. Validate token:
   jwtProvider.validateToken(token)
   ↓
5. JWT library checks expiration:
   currentTime = 10:20 AM
   tokenExpiration = 10:15 AM
   ↓
   currentTime > tokenExpiration → EXPIRED!
   ↓
   Throws ExpiredJwtException
   ↓
6. Exception is caught:
   catch (JwtException e) {
       return false;  // Validation fails
   }
   ↓
7. In JwtAuthFilter:
   if (jwtProvider.validateToken(token)) {
       // This block is NOT executed
   }
   ↓
   email remains NULL
   ↓
8. Authentication is NOT set in SecurityContext:
   if (email != null && SecurityContext.getAuthentication() == null) {
       // This block is NOT executed because email is null
   }
   ↓
9. Request continues to Spring Security authorization
   ↓
10. Spring Security checks:
    - Endpoint /user/me requires authentication
    - SecurityContext has NO authentication
    ↓
    ❌ Request is REJECTED
    ↓
11. Client receives error response:
    HTTP 403 Forbidden
    or
    HTTP 401 Unauthorized
```

---

## 🔄 How to Handle Expired Tokens (Refresh Flow)

When the access token expires, the client should use the **refresh token** to get a new one:

### Client-Side Logic:

```javascript
// Client receives 403/401 error
if (response.status === 403 || response.status === 401) {
    // Try to refresh the token
    const refreshResponse = await fetch('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
            refreshToken: localStorage.getItem('refreshToken')
        })
    });
    
    if (refreshResponse.ok) {
        const { accessToken } = await refreshResponse.json();
        
        // Store new access token
        localStorage.setItem('accessToken', accessToken);
        
        // Retry the original request with new token
        return retryOriginalRequest(accessToken);
    } else {
        // Refresh token also expired - redirect to login
        window.location.href = '/login';
    }
}
```

### Server-Side Refresh Flow:

```
1. Client sends POST /auth/refresh
   {
     "refreshToken": "550e8400-..."
   }

2. AuthService.refreshToken() is called
   ↓
3. Find refresh token in database
   ↓
4. Validate refresh token:
   - Exists in database? ✅
   - Not revoked? ✅
   - Not expired (< 7 days)? ✅
   ↓
5. Generate NEW access token:
   - New expiration = current time + 15 minutes
   ↓
6. Return new token to client:
   {
     "accessToken": "eyJhbGciOi...",  ← New token, valid for 15 minutes
     "refreshToken": "550e8400-..."   ← Same refresh token
   }
```

---

## 📊 Token Lifetime Comparison

| Token Type | Lifetime | Stored Where | Can Be Revoked? | Used For |
|------------|----------|--------------|-----------------|----------|
| **Access Token (JWT)** | 15 minutes | Client (memory/localStorage) | ❌ No (expires naturally) | API authentication |
| **Refresh Token** | 7 days | Client + Database | ✅ Yes (on logout) | Getting new access tokens |

---

## 💡 Why 15 Minutes?

### Security Reasons:

1. **Shorter window for attacks**
   - If a token is stolen, attacker only has 15 minutes to use it
   - After expiration, stolen token becomes useless

2. **Can't be revoked**
   - JWT tokens can't be invalidated server-side
   - Short expiration minimizes risk

3. **Refresh tokens for convenience**
   - Users don't need to login every 15 minutes
   - Refresh token (7 days) handles that
   - Refresh tokens CAN be revoked if needed

---

## 🧪 Testing Token Expiration

### Test 1: Token is Valid (within 15 minutes)

```bash
# Login at 10:00 AM
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Response:
{
  "accessToken": "eyJhbGciOiJI...",
  "refreshToken": "550e8400-..."
}

# Use token at 10:05 AM (5 minutes later)
curl -X GET http://localhost:8081/user/me \
  -H "Authorization: Bearer eyJhbGciOiJI..."

# ✅ SUCCESS - Returns user data
```

### Test 2: Token is Expired (after 15 minutes)

```bash
# Wait 16 minutes after login...

# Try to use token at 10:16 AM
curl -X GET http://localhost:8081/user/me \
  -H "Authorization: Bearer eyJhbGciOiJI..."

# ❌ FAILURE - Returns 403 Forbidden or 401 Unauthorized
```

### Test 3: Refresh Token

```bash
# Refresh the token
curl -X POST http://localhost:8081/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "550e8400-..."}'

# Response:
{
  "accessToken": "eyJNEW_TOKEN...",  ← New token valid for another 15 minutes
  "refreshToken": "550e8400-..."
}

# Use new token
curl -X GET http://localhost:8081/user/me \
  -H "Authorization: Bearer eyJNEW_TOKEN..."

# ✅ SUCCESS - Returns user data
```

---

## 🎯 Key Takeaways

1. **YES, tokens expire after exactly 15 minutes** from the time they were issued

2. **Expiration is enforced automatically** by the JWT library when validating

3. **Expired tokens are completely rejected** - no authentication is set

4. **Clients must handle expiration** by:
   - Detecting 401/403 errors
   - Using refresh token to get new access token
   - Redirecting to login if refresh token also expired

5. **Tokens cannot be manually revoked** - they must expire naturally (that's why they're short-lived)

6. **Refresh tokens solve the UX problem** - users don't need to re-login every 15 minutes

---

## 🔧 How to Change Expiration Time

If you want to change the expiration time, modify `JwtProvider.java`:

```java
// Current: 15 minutes
private final long jwtExpirationMs = 15 * 60 * 1000;

// Change to 30 minutes:
private final long jwtExpirationMs = 30 * 60 * 1000;

// Change to 1 hour:
private final long jwtExpirationMs = 60 * 60 * 1000;

// Change to 24 hours:
private final long jwtExpirationMs = 24 * 60 * 60 * 1000;
```

### ⚠️ Security Note:
- Shorter = More secure (smaller window for attacks)
- Longer = Better UX (fewer refreshes needed)
- **15 minutes is a good balance** for most applications

---

## 🎬 Summary

**Your JWT tokens absolutely DO expire after 15 minutes!** Once expired:
- ❌ They cannot be used to authenticate requests
- ❌ They are automatically rejected by the validation logic
- ✅ Clients must use the refresh token to get a new access token
- ✅ Or redirect users to login if the refresh token is also expired

This is a standard, secure practice in JWT-based authentication systems!

