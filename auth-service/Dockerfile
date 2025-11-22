# Multi-stage build for Spring Boot application

# Stage 1: Build stage
FROM gradle:8.5-jdk21 AS build

# Set working directory
WORKDIR /app

# Copy gradle files first for better caching
COPY build.gradle settings.gradle gradlew ./
COPY gradle gradle/

# Download dependencies (cached if build.gradle hasn't changed)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src src/

# Build the application (skip tests for faster builds, run tests separately in CI/CD)
RUN gradle bootJar --no-daemon -x test

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Change ownership to non-root user
RUN chown -R spring:spring /app

# Switch to non-root user
USER spring:spring

# Expose the application port (default Spring Boot port)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Set JVM options for containerized environment
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
