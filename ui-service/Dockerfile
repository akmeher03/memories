# --- Stage 1: Build the Vite React App ---
FROM node:18-alpine AS build

WORKDIR /app

# Accept build-time argument for backend URL
ARG VITE_BACKEND_URL=http://localhost:8080
# Make it available as environment variable during build
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

COPY package*.json ./
RUN npm install

COPY . .
# Vite will use VITE_BACKEND_URL during build
RUN npm run build


# --- Stage 2: Serve with nginx ---
FROM nginx:1.25-alpine

# Copy build output to nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
