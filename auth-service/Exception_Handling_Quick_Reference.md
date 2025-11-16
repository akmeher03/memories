# Exception Handling - Quick Reference Card

## 🎯 The 3-Step Flow

### 1️⃣ Exception Thrown
```java
// In Service Layer
throw new EmailAlreadyExistsException("Email already registered");
```

### 2️⃣ Handler Catches It
```java
// In GlobalExceptionHandler
@ExceptionHandler(EmailAlreadyExistsException.class)
public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(...) {
    return ResponseEntity.status(409).body(errorResponse);
}
```

### 3️⃣ Client Receives Error
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Email already registered",
  "path": "/auth/register",
  "timestamp": "2025-11-12T10:30:00Z"
}
```

---

## 📋 Exception → Status Code Map

| Exception | HTTP Status | Use Case |
|-----------|-------------|----------|
| `EmailAlreadyExistsException` | 409 Conflict | Duplicate email |
| `InvalidCredentialsException` | 401 Unauthorized | Wrong login |
| `TokenExpiredException` | 401 Unauthorized | Expired JWT |
| `InvalidTokenException` | 401 Unauthorized | Invalid token |
| `UserNotFoundException` | 404 Not Found | User not found |
| `MethodArgumentNotValidException` | 400 Bad Request | Validation failed |
| `Exception` (generic) | 500 Internal Error | Unexpected error |

---

## 🔑 Key Annotations

```java
@RestControllerAdvice              // Global exception handler
@ExceptionHandler(TypeHere.class) // Handles specific exception type
```

---

## 💡 Why This is Better

### ❌ Old Way (Manual Try-Catch)
```java
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    try {
        authService.registerUser(request);
        return ResponseEntity.ok("Success");
    } catch (EmailAlreadyExistsException e) {
        return ResponseEntity.status(409).body(e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.status(500).body("Error");
    }
}
```
**Problems:** Repetitive, inconsistent, hard to maintain

### ✅ New Way (@RestControllerAdvice)
```java
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    authService.registerUser(request);
    return ResponseEntity.ok("Success");
}
// GlobalExceptionHandler handles ALL exceptions automatically!
```
**Benefits:** Clean, consistent, maintainable

---

## 🎬 Example Flow

```
User registers with existing email
    ↓
AuthService checks database
    ↓
Email exists!
    ↓
throw new EmailAlreadyExistsException(...)
    ↓
Spring intercepts exception
    ↓
Finds @ExceptionHandler in GlobalExceptionHandler
    ↓
Calls handleEmailAlreadyExists()
    ↓
Builds ErrorResponse
    ↓
Returns 409 Conflict with error details
    ↓
Client displays: "Email already registered"
```

---

## ✅ Benefits

- ✅ **No try-catch** in controllers
- ✅ **Consistent** error format
- ✅ **Centralized** error handling
- ✅ **Secure** (no stack traces leaked)
- ✅ **Logged** server-side

---

## 🔧 How to Add New Exception

1. **Create exception class**
```java
public class CustomException extends RuntimeException {
    public CustomException(String message) {
        super(message);
    }
}
```

2. **Add handler in GlobalExceptionHandler**
```java
@ExceptionHandler(CustomException.class)
public ResponseEntity<ErrorResponse> handleCustom(
        CustomException ex, HttpServletRequest request) {
    ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .error("Custom Error")
            .message(ex.getMessage())
            .path(request.getRequestURI())
            .timestamp(Instant.now())
            .build();
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
}
```

3. **Throw it in service**
```java
throw new CustomException("Something went wrong");
```

That's it! Spring handles the rest automatically! 🎉

---

For complete details, see: **Exception_Handling_Complete_Guide.md**

