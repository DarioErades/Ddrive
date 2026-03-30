FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Ensure directories exist for volumes
RUN mkdir -p data/uploads db

EXPOSE 3001
CMD ["npm", "start"]
