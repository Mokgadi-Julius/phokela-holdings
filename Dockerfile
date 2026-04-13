# Backend Dockerfile (Root context)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files first for faster build caching
COPY HotelBooking--Backend/package*.json ./
RUN npm install --production

# Copy the rest of the backend code
COPY HotelBooking--Backend/ ./

# Create uploads directory
RUN mkdir -p src/uploads

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
