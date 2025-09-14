# Multi-stage build for Next.js frontend and Python backend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Python backend stage
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/next.config.js ./
COPY --from=frontend-builder /app/tsconfig.json ./
COPY --from=frontend-builder /app/tailwind.config.js ./
COPY --from=frontend-builder /app/postcss.config.js ./

# Copy app directory
COPY app/ ./app/

# Expose ports
EXPOSE 3000 8000

# Start both services
CMD ["sh", "-c", "python backend/main.py & npm start"]