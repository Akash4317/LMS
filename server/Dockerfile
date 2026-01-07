# use stable node js 
FROM node:20-alpine

# Create app directory inside container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all backend source code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["node","src/server.js"]