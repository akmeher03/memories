# Complete Guide: Exception Handling Flow in Spring Boot

## 📚 Overview

Exception handling in your application uses Spring's **@RestControllerAdvice** mechanism to intercept exceptions thrown anywhere in the application and convert them into structured HTTP responses. This provides a centralized, consistent way to handle errors.

---

## 🏗️ Architecture Components

### 1. **Custom Exception Classes**
```
EmailAlreadyExistsException
InvalidCredentialsException
TokenExpiredException
InvalidTokenException
UserNotFoundException
CustomException
```

### 2. **GlobalExceptionHandler** (@RestControllerAdvice)
- Intercepts exceptions
- Converts to ErrorResponse
- Returns appropriate HTTP status codes

### 3. **ErrorResponse** (DTO)
- Standardized error structure
- Contains status, error, message, path, timestamp

---

## 🔄 Complete Exception Handling Flow

### **Step-by-Step Breakdown:**

```
┌──────────────────────────────────────────────────────────────────┐
│  1. CLIENT SENDS REQUEST                                         │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. REQUEST ENTERS SPRING MVC                                    │
│     • DispatcherServlet receives request                         │
│     • Routes to appropriate controller                           │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  3. VALIDATION OCCURS (if @Valid is present)                     │
│     • Spring validates @NotBlank, @Email, @Size, etc.            │
│     • If validation fails → throws MethodArgumentNotValidException│
│     • Jumps directly to GlobalExceptionHandler                   │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓ (if validation passes)
┌──────────────────────────────────────────────────────────────────┐
│  4. CONTROLLER METHOD EXECUTES                                   │
│     • Calls service layer                                        │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  5. SERVICE LAYER EXECUTES                                       │
│     • Business logic runs                                        │
│     • May throw custom exceptions                                │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓ (if exception occurs)
┌──────────────────────────────────────────────────────────────────┐
│  6. EXCEPTION THROWN                                             │
│     throw new EmailAlreadyExistsException("Email already exists")│
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  7. SPRING INTERCEPTS EXCEPTION                                  │
│     • Exception bubbles up through call stack                    │
│     • Spring looks for @ExceptionHandler that matches            │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  8. GLOBAL EXCEPTION HANDLER CATCHES IT                          │
│     @RestControllerAdvice                                        │
│     • Finds matching @ExceptionHandler method                    │
│     • Executes handler method                                    │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  9. HANDLER CREATES ERROR RESPONSE                               │
│     • Builds ErrorResponse object                                │
│     • Sets HTTP status code                                      │
│     • Logs the error                                             │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│  10. RESPONSE RETURNED TO CLIENT                                 │
│      HTTP 409 Conflict                                           │
│      {                                                           │
│        "status": 409,                                            │
│        "error": "Conflict",                                      │
│        "message": "Email already exists",                        │
│        "path": "/auth/register",                                 │
│        "timestamp": "2025-11-12T10:30:00Z"                       │
│      }                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Detailed Example: Registration with Duplicate Email

Let's trace a complete flow when a user tries to register with an email that already exists.

### **1. Client Sends Request**
```bash
POST http://localhost:8081/auth/register
Content-Type: application/json

{
  "email": "existing@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### **2. Request Reaches Controller**
```java
// AuthController.java
@PostMapping("/register")
public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest request) {
    log.info("Register request received for email: {}", request.getEmail());
    authService.registerUser(request);  // ← Calls service
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("User registered successfully", null));
}
```

**What happens here:**
- `@Valid` triggers validation on RegisterRequest
- If validation passes, controller calls `authService.registerUser(request)`

### **3. Service Layer Checks for Duplicate**
```java
// AuthService.java
@Transactional
public void registerUser(RegisterRequest request) {
    // Check if email already exists
    if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
        // ⚠️ EXCEPTION THROWN HERE!
        throw new EmailAlreadyExistsException("Email already registered: " + request.getEmail());
    }
    
    // This code is never reached because exception was thrown
    User user = User.builder()
        .email(request.getEmail())
        .password(passwordEncoder.encode(request.getPassword()))
        .firstName(request.getFirstName())
        .lastName(request.getLastName())
        .build();
    
    userRepository.save(user);
}
```

**What happens here:**
- Service checks database: `userRepository.existsByEmailAndDeletedFalse()` returns **true**
- Condition is true, so `throw new EmailAlreadyExistsException(...)` executes
- **Normal flow stops immediately**
- Exception bubbles up through the call stack
- Controller method never gets to return the success response

### **4. Spring Intercepts the Exception**

Spring's internal mechanism:
```
EmailAlreadyExistsException thrown
    ↓
Bubbles up from AuthService
    ↓
Back to AuthController.register() method
    ↓
Controller can't handle it (no try-catch)
    ↓
Bubbles up to DispatcherServlet
    ↓
DispatcherServlet looks for @ExceptionHandler
    ↓
Finds @RestControllerAdvice class (GlobalExceptionHandler)
    ↓
Scans for matching @ExceptionHandler method
    ↓
Finds: @ExceptionHandler(EmailAlreadyExistsException.class)
    ↓
Calls handleEmailAlreadyExists() method
```

### **5. GlobalExceptionHandler Catches It**
```java
@RestControllerAdvice  // ← Makes this class handle exceptions globally
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)  // ← Handles this specific exception type
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(
            EmailAlreadyExistsException ex,  // ← The exception that was thrown
            HttpServletRequest request) {     // ← Current HTTP request (injected by Spring)
        
        // 1. Log the error
        log.warn("Email already exists: {}", ex.getMessage());
        
        // 2. Build error response
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.CONFLICT.value())  // 409
                .error("Conflict")
                .message(ex.getMessage())  // "Email already registered: existing@example.com"
                .path(request.getRequestURI())  // "/auth/register"
                .timestamp(Instant.now())  // Current timestamp
                .build();
        
        // 3. Return HTTP response with error body
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
}
```

**What happens here:**
1. Spring calls this method with the caught exception
2. Method logs the error (for debugging/monitoring)
3. Creates an `ErrorResponse` object with all details
4. Returns `ResponseEntity` with:
   - HTTP Status: **409 Conflict**
   - Body: `ErrorResponse` object (automatically converted to JSON)

### **6. Response Sent to Client**
```json
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "status": 409,
  "error": "Conflict",
  "message": "Email already registered: existing@example.com",
  "path": "/auth/register",
  "timestamp": "2025-11-12T10:30:00.123Z"
}
```

---

## 🎨 Key Annotations Explained

### **@RestControllerAdvice**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
```

**What it does:**
- Combines `@ControllerAdvice` + `@ResponseBody`
- Makes this class a **global exception handler** for all controllers
- Automatically converts return values to JSON
- Applies to all `@RestController` classes

**Why it's "global":**
- Without it, you'd need try-catch in every controller method
- With it, exceptions from ANY controller are caught here

### **@ExceptionHandler**
```java
@ExceptionHandler(EmailAlreadyExistsException.class)
public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(...) {
```

**What it does:**
- Marks this method as a handler for specific exception type(s)
- When `EmailAlreadyExistsException` is thrown anywhere in the app, this method handles it
- Can handle multiple exception types: `@ExceptionHandler({Exception1.class, Exception2.class})`

**Method parameters (Spring auto-injects):**
- `EmailAlreadyExistsException ex` - The actual exception thrown
- `HttpServletRequest request` - Current HTTP request context
- Can also inject: `WebRequest`, `HttpHeaders`, etc.

---

## 🔍 Different Types of Exception Handlers

### **1. Specific Custom Exception**
```java
@ExceptionHandler(EmailAlreadyExistsException.class)
public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(
        EmailAlreadyExistsException ex, HttpServletRequest request) {
    // Handles ONLY EmailAlreadyExistsException
    ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.CONFLICT.value())  // 409
            .error("Conflict")
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .build();
    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
}
```

**When it's called:**
```java
throw new EmailAlreadyExistsException("Email already registered");
```

**HTTP Response:**
- Status: **409 Conflict**
- Appropriate for resource conflicts

---

### **2. Validation Exceptions**
```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ErrorResponse> handleValidationExceptions(
        MethodArgumentNotValidException ex, HttpServletRequest request) {
    
    // Extract all validation errors
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getAllErrors().forEach((error) -> {
        String fieldName = ((FieldError) error).getField();
        String errorMessage = error.getDefaultMessage();
        errors.put(fieldName, errorMessage);
    });
    
    log.warn("Validation failed: {}", errors);
    
    ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())  // 400
            .error("Validation Failed")
            .message("Invalid input: " + errors.toString())
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .build();
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
}
```

**When it's called:**
```java
// In controller with @Valid
@PostMapping("/register")
public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
    // If request has invalid fields, MethodArgumentNotValidException is thrown
}

// In DTO with validation annotations
public class RegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
```

**Example Invalid Request:**
```json
POST /auth/register
{
  "email": "invalid-email",     // ← Invalid email format
  "password": "123",             // ← Too short
  "firstName": "",               // ← Empty (NotBlank violation)
  "lastName": "Doe"
}
```

**HTTP Response:**
```json
HTTP/1.1 400 Bad Request
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid input: {email=Email must be valid, password=Password must be at least 8 characters, firstName=First name is required}",
  "path": "/auth/register",
  "timestamp": "2025-11-12T10:30:00.123Z"
}
```

**How it works:**
1. Spring validates `@Valid @RequestBody RegisterRequest request`
2. Finds violations: email format, password length, blank firstName
3. Throws `MethodArgumentNotValidException`
4. GlobalExceptionHandler catches it
5. Extracts all field errors from `ex.getBindingResult()`
6. Builds map of field → error message
7. Returns 400 Bad Request with all errors

---

### **3. Catch-All Generic Exception**
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleGenericException(
        Exception ex, HttpServletRequest request) {
    log.error("Unexpected error occurred", ex);
    
    ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())  // 500
            .error("Internal Server Error")
            .message("An unexpected error occurred. Please try again later.")
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .build();
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
}
```

**When it's called:**
- Any exception that doesn't match other handlers
- NullPointerException, IllegalArgumentException, etc.
- Database connection errors
- Any unexpected runtime error

**Why it's important:**
- **Prevents stack traces from leaking to clients**
- **Always have a fallback handler**
- Logs full exception for debugging (server-side only)
- Returns generic message to client (security)

**Example:**
```java
// Somewhere in service
public User getUser() {
    User user = null;
    return user.getEmail();  // ← NullPointerException!
}
```

**HTTP Response:**
```json
HTTP/1.1 500 Internal Server Error
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later.",
  "path": "/user/me",
  "timestamp": "2025-11-12T10:30:00.123Z"
}
```

**Note:** Full stack trace is logged server-side but NOT sent to client (security best practice)

---

## 📊 Exception Handler Priority

Spring processes exception handlers in this order:

1. **Most Specific Exception First**
   ```
   EmailAlreadyExistsException  ← Handled first
   RuntimeException             ← Handled second (parent class)
   Exception                    ← Handled last (top-level parent)
   ```

2. **Example:**
   ```java
   throw new EmailAlreadyExistsException("Email exists");
   
   // Spring checks handlers in order:
   // 1. @ExceptionHandler(EmailAlreadyExistsException.class) ← MATCHES! Uses this
   // 2. @ExceptionHandler(RuntimeException.class)            ← Not checked
   // 3. @ExceptionHandler(Exception.class)                   ← Not checked
   ```

3. **If No Specific Handler:**
   ```java
   throw new IllegalArgumentException("Invalid argument");
   
   // Spring checks handlers in order:
   // 1. @ExceptionHandler(IllegalArgumentException.class)    ← No such handler
   // 2. @ExceptionHandler(RuntimeException.class)            ← No such handler
   // 3. @ExceptionHandler(Exception.class)                   ← MATCHES! Uses this
   ```

---

## 🎯 Complete Flow Examples

### **Example 1: Invalid Login Credentials**

**Request:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "wrongpassword"
}
```

**Flow:**
```
1. AuthController.login() called
   ↓
2. authService.login() called
   ↓
3. User found in database
   ↓
4. Password comparison fails
   ↓
5. throw new InvalidCredentialsException("Invalid email or password")
   ↓
6. Exception bubbles up to AuthController
   ↓
7. Spring intercepts, finds @ExceptionHandler(InvalidCredentialsException.class)
   ↓
8. handleInvalidCredentials() method executes
   ↓
9. Logs: "Invalid credentials attempt"
   ↓
10. Creates ErrorResponse with status 401
   ↓
11. Returns ResponseEntity with 401 Unauthorized
```

**Response:**
```json
HTTP/1.1 401 Unauthorized
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "path": "/auth/login",
  "timestamp": "2025-11-12T10:30:00.123Z"
}
```

---

### **Example 2: Token Expired**

**Request:**
```bash
GET /user/me
Authorization: Bearer <expired-token>
```

**Flow:**
```
1. Request enters JwtAuthFilter
   ↓
2. Token extracted from Authorization header
   ↓
3. jwtProvider.validateToken(token) called
   ↓
4. Jwts.parser() detects token is expired
   ↓
5. Throws ExpiredJwtException
   ↓
6. JwtAuthFilter catches it, returns false from validateToken()
   ↓
7. No authentication set in SecurityContext
   ↓
8. Request proceeds to controller
   ↓
9. Spring Security checks: endpoint requires authentication
   ↓
10. SecurityContext has no authentication
   ↓
11. Spring Security throws AccessDeniedException
   ↓
12. OR service throws TokenExpiredException explicitly
   ↓
13. GlobalExceptionHandler catches it
   ↓
14. handleTokenExpired() executes
```

**Response:**
```json
HTTP/1.1 401 Unauthorized
{
  "status": 401,
  "error": "Token Expired",
  "message": "Token has expired",
  "path": "/user/me",
  "timestamp": "2025-11-12T10:30:00.123Z"
}
```

---

### **Example 3: Validation Error**

**Request:**
```bash
POST /auth/register
{
  "email": "not-an-email",
  "password": "123",
  "firstName": "",
  "lastName": "Doe"
}
```

**Flow:**
```
1. Request enters AuthController.register()
   ↓
2. Spring sees @Valid annotation on @RequestBody parameter
   ↓
3. Spring automatically validates RegisterRequest:
   • email: "not-an-email" → @Email validation fails
   • password: "123" → @Size(min=8) validation fails
   • firstName: "" → @NotBlank validation fails
   ↓
4. Spring throws MethodArgumentNotValidException
   ↓
5. Controller method NEVER executes (validation happens BEFORE)
   ↓
6. Exception goes directly to GlobalExceptionHandler
   ↓
7. handleValidationExceptions() executes
   ↓
8. Extracts all field errors:
   • email → "Email must be valid"
   • password → "Password must be at least 8 characters"
   • firstName → "First name is required"
   ↓
9. Builds map of errors
   ↓
10. Creates ErrorResponse with status 400
   ↓
11. Returns ResponseEntity with 400 Bad Request
```

**Response:**
```json
HTTP/1.1 400 Bad Request
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid input: {email=Email must be valid, password=Password must be at least 8 characters, firstName=First name is required}",
  "path": "/auth/register",
  "timestamp": "2025-11-12T10:30:00.123Z"
}
```

---

## 🔧 How to Add a New Exception Handler

### **Step 1: Create Custom Exception**
```java
package com.auth.layer.exception;

public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String message) {
        super(message);
    }
}
```

### **Step 2: Add Handler in GlobalExceptionHandler**
```java
@ExceptionHandler(AccountLockedException.class)
public ResponseEntity<ErrorResponse> handleAccountLocked(
        AccountLockedException ex, HttpServletRequest request) {
    log.warn("Account locked: {}", ex.getMessage());
    
    ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.FORBIDDEN.value())  // 403
            .error("Account Locked")
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .build();
    
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
}
```

### **Step 3: Throw Exception in Service**
```java
public JwtResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));
    
    // Check if account is locked
    if (user.isLocked()) {
        throw new AccountLockedException("Account is locked due to too many failed login attempts");
    }
    
    // Rest of login logic...
}
```

### **Step 4: Test It**
```bash
# Login with locked account
POST /auth/login
{
  "email": "locked@example.com",
  "password": "password123"
}

# Response:
HTTP/1.1 403 Forbidden
{
  "status": 403,
  "error": "Account Locked",
  "message": "Account is locked due to too many failed login attempts",
  "path": "/auth/login",
  "timestamp": "2025-11-12T10:30:00.123Z"
}
```

---

## 🎓 Key Concepts Summary

### **1. @RestControllerAdvice**
- Global exception handler for all controllers
- Centralized error handling
- Applies to entire application

### **2. @ExceptionHandler**
- Marks methods that handle specific exceptions
- Spring automatically routes exceptions to matching handlers
- Can handle multiple exception types

### **3. Exception Hierarchy**
```
Exception (catch-all)
  └─ RuntimeException
       ├─ EmailAlreadyExistsException
       ├─ InvalidCredentialsException
       ├─ TokenExpiredException
       ├─ InvalidTokenException
       └─ UserNotFoundException
```

### **4. HTTP Status Codes**
| Exception | HTTP Status | Code | Meaning |
|-----------|-------------|------|---------|
| EmailAlreadyExistsException | Conflict | 409 | Resource already exists |
| InvalidCredentialsException | Unauthorized | 401 | Authentication failed |
| TokenExpiredException | Unauthorized | 401 | Token expired |
| InvalidTokenException | Unauthorized | 401 | Token invalid |
| UserNotFoundException | Not Found | 404 | Resource not found |
| MethodArgumentNotValidException | Bad Request | 400 | Invalid input |
| Exception (generic) | Internal Server Error | 500 | Unexpected error |

### **5. ErrorResponse Structure**
```json
{
  "status": 409,                                    // HTTP status code (numeric)
  "error": "Conflict",                              // Error type (readable)
  "message": "Email already registered: user@...",  // Detailed message
  "path": "/auth/register",                         // Which endpoint failed
  "timestamp": "2025-11-12T10:30:00.123Z"          // When it happened
}
```

---

## 🚀 Benefits of This Approach

### **1. Consistency**
- All errors follow the same structure
- Predictable for API consumers
- Easy to parse on client side

### **2. Centralization**
- No try-catch needed in controllers
- All error handling in one place
- Easy to maintain and update

### **3. Security**
- Stack traces never leak to clients
- Generic messages for unexpected errors
- Detailed logging server-side only

### **4. Debugging**
- All errors logged with context
- Easy to trace issues
- Timestamp and path included

### **5. Client-Friendly**
- Clear error messages
- Proper HTTP status codes
- Machine-readable format (JSON)

---

## 🎯 Real-World Flow Visualization

```
USER ACTION: Registers with existing email
    │
    ↓
┌───────────────────────────────────────────┐
│ POST /auth/register                       │
│ { "email": "existing@example.com", ... }  │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ Spring DispatcherServlet                  │
│ • Receives request                        │
│ • Routes to AuthController                │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ AuthController.register()                 │
│ • @Valid validates input ✅               │
│ • Calls authService.registerUser()        │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ AuthService.registerUser()                │
│ • Checks database                         │
│ • Email exists! 🚨                        │
│ • throws EmailAlreadyExistsException      │
└───────────────────────────────────────────┘
    │
    ↓ (Exception bubbles up)
┌───────────────────────────────────────────┐
│ AuthController.register()                 │
│ • Can't handle exception                  │
│ • Exception continues up                  │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ Spring DispatcherServlet                  │
│ • Catches unhandled exception             │
│ • Looks for @RestControllerAdvice         │
│ • Finds GlobalExceptionHandler            │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ GlobalExceptionHandler                    │
│ • Matches @ExceptionHandler               │
│ • Calls handleEmailAlreadyExists()        │
│ • Logs error ⚠️                           │
│ • Builds ErrorResponse                    │
│ • Returns 409 Conflict                    │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ HTTP RESPONSE                             │
│ 409 Conflict                              │
│ {                                         │
│   "status": 409,                          │
│   "error": "Conflict",                    │
│   "message": "Email already registered",  │
│   "path": "/auth/register",               │
│   "timestamp": "2025-11-12T10:30:00Z"     │
│ }                                         │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ USER SEES: "Email already registered"     │
└───────────────────────────────────────────┘
```

---

## 💡 Pro Tips

### **1. Always Log Exceptions**
```java
log.warn("Email already exists: {}", ex.getMessage());  // Log the error
```
- Helps with debugging
- Audit trail
- Monitoring/alerting

### **2. Never Expose Stack Traces to Clients**
```java
// ❌ BAD
return ResponseEntity.status(500).body(ex.getStackTrace());

// ✅ GOOD
log.error("Unexpected error", ex);  // Log with stack trace
return ResponseEntity.status(500).body("An error occurred");  // Generic message
```

### **3. Use Appropriate HTTP Status Codes**
- 400: Client error (bad input)
- 401: Authentication required
- 403: Forbidden (authenticated but not authorized)
- 404: Not found
- 409: Conflict (duplicate resource)
- 500: Server error

### **4. Include Request Path in Errors**
```java
.path(request.getRequestURI())  // Helps client know which endpoint failed
```

### **5. Timestamp Everything**
```java
.timestamp(Instant.now())  // Helps correlate with logs
```

---

## 🎬 Conclusion

The exception handling flow in your application:

1. **Exceptions are thrown** in service layer with specific types
2. **Spring intercepts** them automatically (no try-catch needed)
3. **GlobalExceptionHandler** catches and processes them
4. **ErrorResponse** provides consistent structure
5. **Client receives** proper HTTP status and clear error message
6. **Server logs** full details for debugging

This approach provides:
- ✅ Centralized error handling
- ✅ Consistent API responses
- ✅ Better security (no stack trace leaks)
- ✅ Easier debugging
- ✅ Better user experience

**Your exception handling is now production-ready!** 🎉

