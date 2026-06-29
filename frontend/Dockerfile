# Build Stage
FROM node:20 AS build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Set environment variable for the backend API URL during build
ENV REACT_APP_API_URL=http://localhost:5001/api

# Build the React app
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Copy custom nginx configuration if needed, or just use default
# We copy the built assets from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Replace default Nginx config to support React Router (SPA fallback)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
