# Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the MetaPilot AI Engine in various environments, from development to enterprise production. It covers different deployment strategies, configuration options, monitoring, and best practices for scalable, reliable deployments.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Container Deployment](#container-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Configuration](#security-configuration)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Environment Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- API keys for AI providers (OpenAI, Anthropic)
- Database (optional, for persistence)
- Redis (optional, for caching)

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Environment
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# AI Provider APIs
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/metapilot

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-key
API_KEY_SALT=your-api-key-salt

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_REQUESTS_PER_HOUR=1000

# Features
ENABLE_LEARNING=true
ENABLE_CACHING=true
ENABLE_METRICS=true

# External Services
WEBHOOK_URL=https://your-app.com/webhooks/ai-analysis
CORS_ORIGINS=https://your-frontend.com,https://app.metapilot.ai
```

### Configuration Files

#### Production Configuration

```typescript
// config/production.ts
export const productionConfig = {
  environment: 'production',
  logLevel: 'info',
  
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: 'gpt-4-turbo-preview',
      maxTokens: 2000,
      temperature: 0.3
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: 'claude-3-sonnet-20240229',
      maxTokens: 2000
    }
  },
  
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 10000,
    redis: {
      url: process.env.REDIS_URL,
      keyPrefix: 'metapilot:ai:'
    }
  },
  
  rateLimiting: {
    enabled: true,
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100'),
    requestsPerHour: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '1000')
  },
  
  features: {
    learningEnabled: process.env.ENABLE_LEARNING === 'true',
    fallbackEnabled: true,
    streamingEnabled: true,
    multiProviderEnabled: true
  },
  
  performance: {
    timeout: 30000, // 30 seconds
    maxConcurrent: 50,
    batchSize: 10
  },
  
  monitoring: {
    enabled: true,
    metricsPort: 9090,
    healthCheckPath: '/health'
  }
};
```

## Development Deployment

### Local Development

```bash
# Clone and install
git clone https://github.com/metapilot/ai-engine.git
cd ai-engine
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Run tests
npm test

# Check code quality
npm run lint
npm run type-check
```

### Development Docker Setup

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Development dependencies
RUN npm run build

# Expose ports
EXPOSE 3001 9229

# Development command with debugging
CMD ["npm", "run", "dev:debug"]
```

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  ai-engine-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
      - "9229:9229" # Debug port
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - .:/app
      - /app/node_modules
    env_file:
      - .env.dev
    
  redis-dev:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  redis_dev_data:
```

## Production Deployment

### Standalone Server Deployment

#### Installation Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting MetaPilot AI Engine deployment..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash aiengine
sudo mkdir -p /opt/metapilot-ai
sudo chown aiengine:aiengine /opt/metapilot-ai

# Switch to application user
sudo -u aiengine bash << 'EOF'
cd /opt/metapilot-ai

# Clone repository
git clone https://github.com/metapilot/ai-engine.git .

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Copy configuration
cp config/production.example.json config/production.json

echo "Please edit /opt/metapilot-ai/config/production.json with your settings"
EOF

echo "Deployment completed. Configure the application and start with: sudo -u aiengine pm2 start ecosystem.config.js"
```

#### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'metapilot-ai-engine',
    script: 'dist/index.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto-restart configuration
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '512M',
    
    // Monitoring
    monit: true
  }],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'aiengine',
      host: ['production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:metapilot/ai-engine.git',
      path: '/opt/metapilot-ai',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

#### Systemd Service

```ini
# /etc/systemd/system/metapilot-ai.service
[Unit]
Description=MetaPilot AI Engine
After=network.target

[Service]
Type=simple
User=aiengine
WorkingDirectory=/opt/metapilot-ai
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=metapilot-ai

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/metapilot-ai/logs

[Install]
WantedBy=multi-user.target
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/metapilot-ai
server {
    listen 80;
    server_name ai-api.metapilot.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ai-api.metapilot.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/metapilot-ai.crt;
    ssl_certificate_key /etc/ssl/private/metapilot-ai.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy Configuration
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }

    # Static files (if any)
    location /static/ {
        alias /opt/metapilot-ai/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Container Deployment

### Production Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY meta-pilot-ai-engine/package*.json ./meta-pilot-ai-engine/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aiengine -u 1001

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=aiengine:nodejs /app/dist ./dist
COPY --from=builder --chown=aiengine:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=aiengine:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown aiengine:nodejs logs

# Switch to non-root user
USER aiengine

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Start the application
CMD ["node", "dist/index.js"]
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  ai-engine:
    build:
      context: .
      dockerfile: Dockerfile
    image: metapilot/ai-engine:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    env_file:
      - .env.production
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config:ro
    restart: unless-stopped
    depends_on:
      - redis
      - postgres
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: metapilot
      POSTGRES_USER: aiengine
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aiengine -d metapilot"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - ai-engine
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    driver: bridge
```

## Cloud Deployment

### AWS ECS Deployment

#### Task Definition

```json
{
  "family": "metapilot-ai-engine",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/metapilot-ai-task-role",
  "containerDefinitions": [
    {
      "name": "ai-engine",
      "image": "123456789012.dkr.ecr.us-west-2.amazonaws.com/metapilot/ai-engine:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-west-2:123456789012:secret:metapilot/openai-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/metapilot-ai-engine",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })\""
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 30
      }
    }
  ]
}
```

#### ECS Service Configuration

```yaml
# ecs-service.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ecs-service-config
data:
  service.json: |
    {
      "serviceName": "metapilot-ai-engine",
      "cluster": "metapilot-cluster",
      "taskDefinition": "metapilot-ai-engine:1",
      "desiredCount": 3,
      "launchType": "FARGATE",
      "networkConfiguration": {
        "awsvpcConfiguration": {
          "subnets": [
            "subnet-12345678",
            "subnet-87654321"
          ],
          "securityGroups": [
            "sg-ai-engine"
          ],
          "assignPublicIp": "DISABLED"
        }
      },
      "loadBalancers": [
        {
          "targetGroupArn": "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/metapilot-ai-tg/abc123",
          "containerName": "ai-engine",
          "containerPort": 3001
        }
      ],
      "serviceRegistries": [
        {
          "registryArn": "arn:aws:servicediscovery:us-west-2:123456789012:service/srv-ai-engine"
        }
      ]
    }
```

### Google Cloud Run Deployment

```yaml
# cloudrun.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: metapilot-ai-engine
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "1"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "2Gi"
        run.googleapis.com/cpu: "2"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/your-project/metapilot-ai-engine:latest
        ports:
        - name: http1
          containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-engine-secrets
              key: openai-api-key
        resources:
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metapilot-ai-engine
  labels:
    app: metapilot-ai-engine
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: metapilot-ai-engine
  template:
    metadata:
      labels:
        app: metapilot-ai-engine
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: ai-engine
        image: metapilot/ai-engine:latest
        ports:
        - containerPort: 3001
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-engine-secrets
              key: openai-api-key
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
        volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
        - name: logs-volume
          mountPath: /app/logs
      volumes:
      - name: tmp-volume
        emptyDir: {}
      - name: logs-volume
        emptyDir: {}
      securityContext:
        fsGroup: 1001

---
apiVersion: v1
kind: Service
metadata:
  name: ai-engine-service
  labels:
    app: metapilot-ai-engine
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3001
    protocol: TCP
    name: http
  - port: 9090
    targetPort: 9090
    protocol: TCP
    name: metrics
  selector:
    app: metapilot-ai-engine

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-engine-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - ai-api.metapilot.com
    secretName: ai-engine-tls
  rules:
  - host: ai-api.metapilot.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-engine-service
            port:
              number: 80
```

## Monitoring and Logging

### Prometheus Metrics

```typescript
// monitoring/metrics.ts
import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'metapilot-ai-engine'
});

// Define metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const aiAnalysisRequestsTotal = new client.Counter({
  name: 'ai_analysis_requests_total',
  help: 'Total number of AI analysis requests',
  labelNames: ['type', 'provider', 'status']
});

export const aiAnalysisDuration = new client.Histogram({
  name: 'ai_analysis_duration_seconds',
  help: 'Duration of AI analysis requests in seconds',
  labelNames: ['type', 'provider', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

export const aiAnalysisConfidence = new client.Histogram({
  name: 'ai_analysis_confidence',
  help: 'Confidence scores of AI analysis results',
  labelNames: ['type', 'provider'],
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]
});

export const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['type']
});

export const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['type']
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(aiAnalysisRequestsTotal);
register.registerMetric(aiAnalysisDuration);
register.registerMetric(aiAnalysisConfidence);
register.registerMetric(cacheHitsTotal);
register.registerMetric(cacheMissesTotal);
register.registerMetric(activeConnections);

// Collect default metrics
client.collectDefaultMetrics({ register });

export { register };
```

### Structured Logging

```typescript
// logging/logger.ts
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'metapilot-ai-engine',
    version: process.env.npm_package_version
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File output
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// If we're not in production then log to the `console`
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Create context-aware logger
export const createContextLogger = (context: string) => {
  return logger.child({ context });
};
```

## Security Configuration

### Security Middleware

```typescript
// security/middleware.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API key authentication
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key in the X-API-Key header'
    });
  }
  
  // Validate API key (implement your validation logic)
  if (!isValidApiKey(apiKey)) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  // Add user context to request
  req.user = getUserFromApiKey(apiKey);
  next();
};

// Input validation
export const validateJsonInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      if (req.body && typeof req.body === 'string') {
        req.body = JSON.parse(req.body);
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      });
    }
  }
  next();
};

function isValidApiKey(apiKey: string): boolean {
  // Implement API key validation logic
  return true; // Placeholder
}

function getUserFromApiKey(apiKey: string): any {
  // Implement user lookup logic
  return { id: 'user-123', name: 'Example User' };
}
```

### SSL/TLS Configuration

```bash
#!/bin/bash
# ssl-setup.sh

# Generate SSL certificate with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d ai-api.metapilot.com

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# Strong Diffie-Hellman parameters
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 4096
```

## Performance Optimization

### Caching Strategy

```typescript
// caching/redis-cache.ts
import Redis from 'ioredis';
import { logger } from '../logging/logger';

export class RedisCache {
  private client: Redis;
  private defaultTTL: number;

  constructor(url: string, defaultTTL: number = 3600) {
    this.client = new Redis(url, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
    
    this.defaultTTL = defaultTTL;
    
    this.client.on('error', (error) => {
      logger.error('Redis error:', error);
    });
    
    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl || this.defaultTTL, serialized);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}
```

### Load Balancing

```nginx
# nginx/conf.d/load-balancer.conf
upstream ai_engine_backend {
    least_conn;
    server ai-engine-1:3001 max_fails=3 fail_timeout=30s;
    server ai-engine-2:3001 max_fails=3 fail_timeout=30s;
    server ai-engine-3:3001 max_fails=3 fail_timeout=30s;
    
    # Health check
    keepalive 32;
}

server {
    listen 80;
    server_name ai-api.metapilot.com;

    # Load balancing configuration
    location / {
        proxy_pass http://ai_engine_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Connection pooling
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Retry configuration
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://ai_engine_backend/health;
        proxy_connect_timeout 2s;
        proxy_send_timeout 2s;
        proxy_read_timeout 2s;
        access_log off;
    }
}
```

## Troubleshooting

### Common Issues

#### Memory Leaks

```typescript
// monitoring/memory-monitor.ts
import { logger } from '../logging/logger';

export class MemoryMonitor {
  private interval: NodeJS.Timeout;
  private threshold: number;

  constructor(checkIntervalMs: number = 30000, thresholdMB: number = 512) {
    this.threshold = thresholdMB * 1024 * 1024; // Convert to bytes
    
    this.interval = setInterval(() => {
      this.checkMemoryUsage();
    }, checkIntervalMs);
  }

  private checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    
    logger.info('Memory usage:', {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(usage.external / 1024 / 1024) + ' MB'
    });

    if (usage.heapUsed > this.threshold) {
      logger.warn('High memory usage detected:', {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
        threshold: Math.round(this.threshold / 1024 / 1024) + ' MB'
      });
    }
  }

  stop(): void {
    clearInterval(this.interval);
  }
}
```

#### Debugging Tools

```bash
#!/bin/bash
# debug-tools.sh

# Install debugging tools
npm install -g clinic
npm install -g autocannon

# Memory profiling
clinic doctor -- node dist/index.js

# CPU profiling
clinic flame -- node dist/index.js

# Load testing
autocannon -c 10 -d 30 http://localhost:3001/health
```

### Health Checks

```typescript
// health/health-check.ts
import { Request, Response } from 'express';
import { AIEngine } from '@metapilot/ai-engine';
import { RedisCache } from '../caching/redis-cache';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    aiEngine: boolean;
    redis: boolean;
    memory: boolean;
    disk: boolean;
  };
  details: Record<string, any>;
}

export const createHealthCheck = (aiEngine: AIEngine, cache: RedisCache) => {
  return async (req: Request, res: Response) => {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      checks: {
        aiEngine: false,
        redis: false,
        memory: false,
        disk: false
      },
      details: {}
    };

    // Check AI Engine
    try {
      const status = aiEngine.getStatus();
      health.checks.aiEngine = status.initialized;
      health.details.aiEngine = {
        initialized: status.initialized,
        pluginsLoaded: status.pluginsLoaded
      };
    } catch (error) {
      health.checks.aiEngine = false;
      health.details.aiEngine = { error: error.message };
    }

    // Check Redis
    try {
      await cache.set('health-check', 'ok', 60);
      const result = await cache.get('health-check');
      health.checks.redis = result === 'ok';
      health.details.redis = { connected: true };
    } catch (error) {
      health.checks.redis = false;
      health.details.redis = { error: error.message };
    }

    // Check memory
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    health.checks.memory = memoryUsedMB < 512; // Less than 512MB
    health.details.memory = {
      heapUsedMB: Math.round(memoryUsedMB),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024)
    };

    // Overall status
    const allChecks = Object.values(health.checks);
    if (allChecks.every(check => check)) {
      health.status = 'healthy';
    } else if (allChecks.some(check => check)) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  };
};
```

### Log Analysis

```bash
#!/bin/bash
# log-analysis.sh

# Error rate analysis
grep "ERROR" logs/combined.log | wc -l

# Response time analysis
grep "request completed" logs/combined.log | \
  awk '{print $NF}' | \
  awk '{sum+=$1; count++} END {print "Average response time: " sum/count "ms"}'

# Top error messages
grep "ERROR" logs/combined.log | \
  awk -F'"message":"' '{print $2}' | \
  awk -F'"' '{print $1}' | \
  sort | uniq -c | sort -rn | head -10

# API endpoint usage
grep "request started" logs/combined.log | \
  awk -F'"path":"' '{print $2}' | \
  awk -F'"' '{print $1}' | \
  sort | uniq -c | sort -rn
```

This comprehensive deployment guide provides all the necessary information and configurations for deploying the MetaPilot AI Engine in various environments with proper monitoring, security, and performance optimization.