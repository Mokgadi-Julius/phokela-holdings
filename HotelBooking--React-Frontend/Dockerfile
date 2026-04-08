# Frontend Dockerfile (Root context)
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy frontend package files
COPY HotelBooking--React-Frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY HotelBooking--React-Frontend/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy built files from builder /app/dist to /app/dist
COPY --from=builder /app/dist ./dist

# The app MUST listen on the port provided by Railway
EXPOSE 3000

# Start application using the PORT environment variable
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
