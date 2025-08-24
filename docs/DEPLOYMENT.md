# Deployment Guide

This guide provides instructions for deploying the Authentication API to various platforms.

## Prerequisites

- Node.js v16 or higher
- PostgreSQL v12 or higher
- npm or yarn
- Git

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# Cloudinary
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW="900000"
AUTH_RATE_LIMIT_MAX="5"

# Server
PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL="https://yourdomain.com"
```

### 4. Database Setup

#### Create Database

```sql
CREATE DATABASE your_database_name;
```

#### Run Migrations

```bash
npm run db:migrate
```

#### Seed Database (Optional)

```bash
npm run db:seed
```

## Development

### Start Development Server

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Lint Code

```bash
npm run lint
```

### Fix Linting Issues

```bash
npm run lint:fix
```

## Production Deployment

### 1. Build the Application

```bash
npm run build
```

### 2. Start Production Server

```bash
npm start
```

## Deployment Platforms

### Heroku

#### 1. Create Heroku App

```bash
heroku create your-app-name
```

#### 2. Set Environment Variables

```bash
heroku config:set DATABASE_URL="your-production-database-url"
heroku config:set JWT_SECRET="your-production-jwt-secret"
heroku config:set JWT_REFRESH_SECRET="your-production-refresh-secret"
heroku config:set GOOGLE_CLIENT_ID="your-production-google-client-id"
heroku config:set GOOGLE_CLIENT_SECRET="your-production-google-client-secret"
heroku config:set RESEND_API_KEY="your-production-resend-api-key"
heroku config:set FROM_EMAIL="noreply@yourdomain.com"
heroku config:set CLOUDINARY_API_KEY="your-production-cloudinary-api-key"
heroku config:set CLOUDINARY_API_SECRET="your-production-cloudinary-api-secret"
heroku config:set CLOUDINARY_CLOUD_NAME="your-production-cloudinary-cloud-name"
heroku config:set AUTH_RATE_LIMIT_WINDOW="900000"
heroku config:set AUTH_RATE_LIMIT_MAX="5"
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL="https://yourdomain.com"
```

#### 3. Add PostgreSQL Add-on

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### 4. Push to Heroku

```bash
git push heroku main
```

#### 5. Run Migrations

```bash
heroku run npm run db:migrate
```

#### 6. View Logs

```bash
heroku logs --tail
```

### AWS Elastic Beanstalk

#### 1. Create Elastic Beanstalk Application

```bash
eb init -p "Node.js" your-app-name
```

#### 2. Create Environment

```bash
eb create production
```

#### 3. Set Environment Variables

```bash
eb setenv DATABASE_URL="your-production-database-url" \
          JWT_SECRET="your-production-jwt-secret" \
          JWT_REFRESH_SECRET="your-production-refresh-secret" \
          GOOGLE_CLIENT_ID="your-production-google-client-id" \
          GOOGLE_CLIENT_SECRET="your-production-google-client-secret" \
          RESEND_API_KEY="your-production-resend-api-key" \
          FROM_EMAIL="noreply@yourdomain.com" \
          CLOUDINARY_API_KEY="your-production-cloudinary-api-key" \
          CLOUDINARY_API_SECRET="your-production-cloudinary-api-secret" \
          CLOUDINARY_CLOUD_NAME="your-production-cloudinary-cloud-name" \
          AUTH_RATE_LIMIT_WINDOW="900000" \
          AUTH_RATE_LIMIT_MAX="5" \
          NODE_ENV=production \
          FRONTEND_URL="https://yourdomain.com"
```

#### 4. Deploy

```bash
eb deploy
```

#### 5. Run Migrations

```bash
eb ssh --command "npm run db:migrate"
```

### Docker

#### 1. Build Docker Image

```bash
docker build -t your-auth-api .
```

#### 2. Run Docker Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-production-database-url" \
  -e JWT_SECRET="your-production-jwt-secret" \
  -e JWT_REFRESH_SECRET="your-production-refresh-secret" \
  -e GOOGLE_CLIENT_ID="your-production-google-client-id" \
  -e GOOGLE_CLIENT_SECRET="your-production-google-client-secret" \
  -e RESEND_API_KEY="your-production-resend-api-key" \
  -e FROM_EMAIL="noreply@yourdomain.com" \
  -e CLOUDINARY_API_KEY="your-production-cloudinary-api-key" \
  -e CLOUDINARY_API_SECRET="your-production-cloudinary-api-secret" \
  -e CLOUDINARY_CLOUD_NAME="your-production-cloudinary-cloud-name" \
  -e AUTH_RATE_LIMIT_WINDOW="900000" \
  -e AUTH_RATE_LIMIT_MAX="5" \
  -e NODE_ENV=production \
  -e FRONTEND_URL="https://yourdomain.com" \
  your-auth-api
```

#### 3. Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://username:password@db:5432/database_name
      - JWT_SECRET=your-production-jwt-secret
      - JWT_REFRESH_SECRET=your-production-refresh-secret
      - GOOGLE_CLIENT_ID=your-production-google-client-id
      - GOOGLE_CLIENT_SECRET=your-production-google-client-secret
      - RESEND_API_KEY=your-production-resend-api-key
      - FROM_EMAIL=noreply@yourdomain.com
      - CLOUDINARY_API_KEY=your-production-cloudinary-api-key
      - CLOUDINARY_API_SECRET=your-production-cloudinary-api-secret
      - CLOUDINARY_CLOUD_NAME=your-production-cloudinary-cloud-name
      - AUTH_RATE_LIMIT_WINDOW=900000
      - AUTH_RATE_LIMIT_MAX=5
      - NODE_ENV=production
      - FRONTEND_URL=https://yourdomain.com
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=database_name
      - POSTGRES_USER=username
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with Docker Compose:

```bash
docker-compose up -d
```

### DigitalOcean App Platform

#### 1. Create App Platform App

```bash
doctl apps create \
  --spec app-spec.yaml
```

Create an `app-spec.yaml` file:

```yaml
name: your-auth-api
services:
  - name: web
    source_dir: /
    github:
      repo: yourusername/your-repo
      branch: main
    run_command: npm start
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: DATABASE_URL
        value: your-production-database-url
      - key: JWT_SECRET
        value: your-production-jwt-secret
      - key: JWT_REFRESH_SECRET
        value: your-production-refresh-secret
      - key: GOOGLE_CLIENT_ID
        value: your-production-google-client-id
      - key: GOOGLE_CLIENT_SECRET
        value: your-production-google-client-secret
      - key: RESEND_API_KEY
        value: your-production-resend-api-key
      - key: FROM_EMAIL
        value: noreply@yourdomain.com
      - key: CLOUDINARY_API_KEY
        value: your-production-cloudinary-api-key
      - key: CLOUDINARY_API_SECRET
        value: your-production-cloudinary-api-secret
      - key: CLOUDINARY_CLOUD_NAME
        value: your-production-cloudinary-cloud-name
      - key: AUTH_RATE_LIMIT_WINDOW
        value: 900000
      - key: AUTH_RATE_LIMIT_MAX
        value: 5
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        value: https://yourdomain.com
databases:
  - name: your-auth-api-db
    engine: PG
    version: '13'
    size: db-s-database-name
    region: nyc3
```

#### 2. Deploy

```bash
doctl apps create --spec app-spec.yaml
```

## Monitoring and Logging

### Logging

#### Winston Logger

The application uses Winston for logging. Logs are written to:

- Console in development
- File in production (`logs/app.log`)

#### Log Levels

- `error`: Error messages
- `warn`: Warning messages
- `info`: Informational messages
- `debug`: Debug messages

### Monitoring

#### Health Check

The application provides a health check endpoint:

```bash
curl https://yourdomain.com/health
```

#### Metrics

The application exposes metrics at:

```bash
https://yourdomain.com/metrics
```

### Error Tracking

#### Sentry Integration

To integrate Sentry:

1. Create a Sentry account
2. Get your DSN
3. Set the `SENTRY_DSN` environment variable

```env
SENTRY_DSN="your-sentry-dsn"
```

## Security Best Practices

### 1. Environment Variables

- Never commit environment variables to version control
- Use a secrets management service in production
- Rotate secrets regularly

### 2. Database Security

- Use SSL for database connections
- Limit database user privileges
- Regularly update database software

### 3. JWT Security

- Use strong secrets
- Set appropriate expiration times
- Implement token rotation

### 4. Rate Limiting

- Monitor rate limiting metrics
- Adjust limits based on usage patterns
- Implement IP whitelisting for trusted services

### 5. CORS

- Configure CORS origins appropriately
- Avoid wildcard origins in production

### 6. HTTPS

- Always use HTTPS in production
- Use HSTS headers
- Configure SSL/TLS properly

## Backup and Recovery

### Database Backups

#### Automated Backups

Set up automated backups using your database provider's tools.

#### Manual Backups

```bash
pg_dump your_database_name > backup.sql
```

### File Storage Backups

#### Cloudinary

Cloudinary provides automatic backups. You can also download assets using the API:

```bash
curl -X GET "https://api.cloudinary.com/v1_1/your_cloud_name/resources/image" \
  -H "Authorization: Basic your_api_key:your_api_secret"
```

## Scaling

### Horizontal Scaling

- Use a load balancer
- Implement sticky sessions for JWT
- Use a shared database
- Use a shared file storage system

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Use caching (Redis)

## Troubleshooting

### Common Issues

#### Database Connection Issues

Check the `DATABASE_URL` and ensure the database is running.

#### JWT Token Issues

Verify that the `JWT_SECRET` is set correctly and hasn't changed.

#### Rate Limiting Issues

Check the rate limiting configuration and adjust as needed.

#### Email Sending Issues

Verify the `RESEND_API_KEY` and `FROM_EMAIL` are set correctly.

### Debug Mode

Enable debug mode by setting the `LOG_LEVEL` environment variable to `debug`:

```env
LOG_LEVEL=debug
```

### Health Checks

Monitor the health of your application:

```bash
curl -f https://yourdomain.com/health || exit 1
```

## Support

For deployment issues, please check:

1. [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. [API Documentation](./API.md)
3. [GitHub Issues](https://github.com/yourusername/your-repo/issues)

## Contributing

To contribute to this deployment guide:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
