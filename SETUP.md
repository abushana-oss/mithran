# EMITHRAN Platform - Setup Guide

## Quick Start

### 1. Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 20+ (for local development)
- **Git** for version control

### 2. Initial Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd mithran

# Copy environment template
cp .env.example .env

# Edit .env with your actual values
# IMPORTANT: Generate secure passwords!
```

### 3. Generate Secure Passwords

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Use these for:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `RABBITMQ_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `JWT_SECRET`

### 4. Configure Supabase

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy the following to your `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (from Settings → API → service_role key)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Settings → API → anon public)

### 5. Start the Platform

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

### 6. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:4000 | - |
| **API Docs** | http://localhost:4000/api/docs | - |
| **CAD Engine** | http://localhost:5000 | - |
| **PostgreSQL** | localhost:5432 | See `.env` |
| **Redis** | localhost:6379 | See `.env` |
| **RabbitMQ UI** | http://localhost:15672 | See `.env` |
| **MinIO Console** | http://localhost:9001 | See `.env` |

### 7. Verify Installation

```bash
# Check frontend
curl http://localhost:3000

# Check backend
curl http://localhost:4000/health

# Check CAD engine
curl http://localhost:5000/health
```

## Development Workflow

### Local Development (without Docker)

```bash
# 1. Start infrastructure only
docker-compose up -d postgres redis rabbitmq minio

# 2. Start backend
cd backend
npm install
npm run start:dev

# 3. Start frontend (in new terminal)
cd ..
npm install
npm run dev

# 4. Start CAD engine (in new terminal)
cd cad-engine
pip install -r requirements.txt
python main.py
```

### Database Migrations

```bash
# Run migrations
cd backend
npm run db:migrate

# Reset database (CAUTION: Deletes all data)
npm run db:migrate:reset
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f cad-engine
```

## Production Deployment

### 1. Update Environment

```bash
# Copy production template
cp .env.example .env.production

# Set production values
NODE_ENV=production
LOG_LEVEL=warn
```

### 2. Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Set proper CORS_ORIGIN (your domain)
- [ ] Enable HTTPS/SSL
- [ ] Set network isolation (internal: true in docker-compose)
- [ ] Configure firewall rules
- [ ] Setup backup strategy
- [ ] Enable monitoring

### 3. Deploy

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start in production mode
docker-compose -f docker-compose.yml up -d
```

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Restart specific service
docker-compose restart backend

# Rebuild service
docker-compose up -d --build backend
```

### Database connection errors

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U emithran_user -d emithran
```

### Port conflicts

```bash
# Change ports in .env
FRONTEND_PORT=3001
BACKEND_PORT=4001
```

### Clean restart

```bash
# Stop all services
docker-compose down

# Remove volumes (CAUTION: Deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Backup & Restore

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U emithran_user emithran > backup.sql

# Restore
docker-compose exec -T postgres psql -U emithran_user emithran < backup.sql
```

### MinIO Backup

```bash
# Access MinIO container
docker-compose exec minio sh

# Use mc (MinIO Client) for backup
mc mirror /data /backup
```

## Monitoring

### Health Checks

```bash
# Check all services
curl http://localhost:3000/api/health  # Frontend
curl http://localhost:4000/health      # Backend
curl http://localhost:5000/health      # CAD Engine
```

### Resource Usage

```bash
# View resource usage
docker stats

# View specific service
docker stats emithran-backend
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review documentation
3. Contact EMITHRAN support team

---

**EMITHRAN Development Team**
