# --- Stage 1: Build the Vite React App ---
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# --- Stage 2: Serve with nginx ---
FROM nginx:1.25-alpine

# Copy build output to nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
