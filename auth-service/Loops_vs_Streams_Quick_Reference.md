# Loops vs Streams: Quick Reference Guide

## When to Use What - Instant Decision Guide

### Use Traditional FOR Loop ✅
- Need index access: `for (int i = 0; i < size; i++)`
- Iterate backwards: `for (int i = size-1; i >= 0; i--)`
- Custom stepping: `for (int i = 0; i < size; i += 2)`
- Modify array in place: `array[i] = newValue`
- Compare adjacent elements: `array[i] vs array[i+1]`

### Use FOR-EACH Loop ✅
- **Security filters** (runs on every request)
- **Simple iteration** (no transformations)
- **Performance-critical paths**
- Reading all elements without modification
- Clear, straightforward logic

### Use STREAMS ✅
- **Filtering**: `.filter(predicate)`
- **Mapping**: `.map(transformer)`
- **Multiple operations**: `.filter().map().sorted()`
- **Finding elements**: `.findFirst()`, `.anyMatch()`
- **Grouping data**: `.collect(Collectors.groupingBy())`
- **Complex transformations**
- **Business logic** (readability > performance)

### Use PARALLEL STREAMS ✅
- **Large datasets** (> 10,000 elements)
- **CPU-intensive operations** (image processing, calculations)
- **Independent operations** (no shared state)

---

## Code Examples by Use Case

### Authentication/Security
```java
// ✅ FOR-EACH (performance-critical)
for (String path : skipPaths) {
    if (requestPath.startsWith(path)) {
        return true;
    }
}
```

### Data Transformation
```java
// ✅ STREAM (readable and maintainable)
return users.stream()
        .filter(User::isActive)
        .map(this::convertToDTO)
        .collect(Collectors.toList());
```

### Simple Validation
```java
// ✅ BOTH WORK (choose based on preference)
// For-each
for (User user : users) {
    if (!isValid(user)) return false;
}

// Stream
return users.stream().allMatch(this::isValid);
```

### Array Modification
```java
// ✅ FOR LOOP (in-place modification)
for (int i = 0; i < array.length; i++) {
    array[i] *= 2;
}
```

### Large Dataset Processing
```java
// ✅ PARALLEL STREAM (CPU-intensive)
return largeDataset.parallelStream()
        .map(this::expensiveOperation)
        .collect(Collectors.toList());
```

---

## Performance Quick Facts

| Size | For Loop | Stream | Parallel Stream |
|------|----------|--------|-----------------|
| < 100 | Best | 20% slower | 3x slower |
| 100-10k | Best | Similar | No benefit |
| > 10k | Best (simple) | Similar | Best (complex) |

---

## Common Mistakes to Avoid

### ❌ Parallel Stream with Side Effects
```java
List<String> results = new ArrayList<>();
items.parallelStream()
        .forEach(item -> results.add(item)); // RACE CONDITION!
```

### ❌ Modifying While Iterating
```java
for (String item : list) {
    list.remove(item); // ConcurrentModificationException!
}
```

### ❌ Reusing Streams
```java
Stream<String> s = list.stream();
s.forEach(System.out::println);
s.forEach(System.out::println); // IllegalStateException!
```

### ❌ Over-engineering Simple Logic
```java
// Too complex for simple task
return list.stream()
        .collect(Collectors.collectingAndThen(
            Collectors.toList(),
            Collections::unmodifiableList
        ));

// Just use
return List.copyOf(list);
```

---

## Decision Flowchart

```
Is it a security filter or hot loop?
├─ YES → Use FOR-EACH
└─ NO → Does it involve multiple transformations?
        ├─ YES → Use STREAMS
        │        └─ Large dataset + CPU-intensive?
        │            ├─ YES → PARALLEL STREAM
        │            └─ NO → Regular STREAM
        └─ NO → Need index or backward iteration?
                ├─ YES → FOR loop
                └─ NO → Use FOR-EACH
```

---

## Project-Specific Recommendations

### Your Auth Service:

| Component | Use | Reason |
|-----------|-----|--------|
| JwtAuthFilter | FOR-EACH | Runs on every request |
| AuthService | STREAMS | Data transformations |
| DTOs conversion | STREAMS | Mapping operations |
| Validation | Either | Both work well |
| Database ops | FOR-EACH | I/O bound |

---

## Quick Syntax Reference

### Traditional For
```java
for (int i = 0; i < list.size(); i++) {
    process(list.get(i));
}
```

### For-Each
```java
for (Type item : collection) {
    process(item);
}
```

### Stream Pipeline
```java
collection.stream()
          .filter(predicate)
          .map(transformer)
          .collect(Collectors.toList());
```

### Parallel Stream
```java
collection.parallelStream()
          .map(expensiveOperation)
          .collect(Collectors.toList());
```

---

## Golden Rules

1. **Performance matters in filters** → Use loops
2. **Readability matters in business logic** → Use streams
3. **Small collections** → Both are fine
4. **Large + CPU-intensive** → Parallel streams
5. **In-place modification** → Traditional for loop
6. **When in doubt** → Choose what's clearer to read

---

**Remember**: The best choice is the one that makes your code clear and maintainable!

*Quick Reference v1.0 - November 17, 2025*

