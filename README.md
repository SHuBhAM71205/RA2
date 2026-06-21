---
title: Resume Analyzer
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
app_file: docker-compose.yml
pinned: false
---

# Resume Analyzer - Complete Setup Guide

A production-ready resume analysis system combining FastAPI backend, AI services with embeddings, and vector search capabilities.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Services & Ports](#services--ports)
- [Monitoring & Debugging](#monitoring--debugging)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

---

## 🎯 Project Overview

The Resume Analyzer is a scalable system that:
- **Analyzes resumes** using AI embeddings
- **Performs semantic search** with Qdrant vector database
- **Stores files** in MinIO object storage
- **Processes jobs asynchronously** with Celery workers
- **Manages data** in PostgreSQL database
- **Caches responses** with Redis

### Key Features
✅ FastAPI REST API with authentication  
✅ Async job processing with Celery  
✅ Vector similarity search (Qdrant)  
✅ Object storage (MinIO)  
✅ Rate limiting and caching  
✅ JWT-based authentication  
✅ Database migrations with Alembic  

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React/Vite)  │
└────────┬────────┘
         │ HTTP
    ┌────▼─────────────────┬─────────────────┐
    │                      │                 │
┌───▼────┐           ┌─────▼──┐        ┌────▼──┐
│Backend  │           │AI      │        │Health │
│FastAPI  │ ◄────────►│Celery  │◄──────┤Check  │
│         │           │Workers │        │       │
└───┬────┘           └─────┬──┘        └───────┘
    │                      │
    ├──────────────────────┼───────────────────┐
    │                      │                   │
┌───▼──┐   ┌────┐   ┌──────▼──┐   ┌─────┐   ┌▼──┐
│  DB  │   │Qdrant  │ MinIO   │   │Redis│   │...│
│ PG17 │   │Vector  │ Storage │   │     │   │   │
└──────┘   └────┘   └─────────┘   └─────┘   └───┘
```

---

## 📦 Prerequisites

### Required
- **Docker** (v20.10+)
- **Docker Compose** (v1.29+)
- **Git**
- **.env file** (see Configuration section)

### Optional
- **Python 3.13** (for local development without Docker)
- **uv** or **pip** (Python package manager)
- **Celery CLI** (for debugging workers)

---

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to project directory
cd RA2

# Create .env file (copy template)
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Run Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Verify Deployment

```bash
# Check API is running
curl http://localhost:8000/

# Check database
curl http://localhost:8000/health

# View container status
docker ps

# View backend container logs
docker logs RA_BACKEND -f
```

---

## 🎛️ Deployment

**Containers started by Docker Compose:**
- `RA_BACKEND` - FastAPI server
- `RA_CELERY_WORKER` - Async task processor
- `RA_CELERY_BEAT` - Job scheduler
- `RA_POSTGRES` - Database
- `RA_REDIS` - Cache & broker
- `RA_QDRANT` - Vector database
- `RA_MINIO` - Object storage
- `RA_PGADMIN` - Database UI

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in root directory:

```bash
# ==================== DATABASE ====================
BACKEND_SECRETE_KEY=your-secret-key-here
HASHING_ALGO=HS256

# PostgreSQL
PG_DB_NAME=resume_db
PG_DB_USER=postgres
PG_DB_PASSWORD=secure_password
PG_DB_PORT=5432
PG_DB_HOST=db  # Use 'db' for docker, 'localhost' for local

# PgAdmin (Database UI)
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin_password

# ==================== STORAGE ====================
# MinIO (Object Storage)
MINIO_CLIENT_PORT=9000
MINIO_UI_PORT=9001
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_password
MINIO_HOST=minio  # Use 'minio' for docker, 'localhost' for local
MINIO_BUCKET_NAME=resume

# Qdrant (Vector Database)
QDRANT_HOST=qdrant  # Use 'qdrant' for docker, 'localhost' for local
QDRANT_PORT=6333

# ==================== CACHING & MESSAGING ====================
# Redis - General Purpose
GEN_REDIS_HOST=redis  # Use 'redis' for docker, 'localhost' for local
GEN_REDIS_PORT=6379
GEN_REDIS_LOGICAL_DB=1

# Redis - Celery
A_CELERY_REDIS_LOGICAL_DB=0
A_CELERY_BROKER=redis
A_CELERY_BROKER_HOST=redis  # Use 'redis' for docker, 'localhost' for local
A_CELERY_BROKER_PORT=6379
A_CELERY_BACKEND=redis
A_CELERY_BACKEND_HOST=redis  # Use 'redis' for docker, 'localhost' for local
A_CELERY_BACKEND_PORT=6379

# ==================== RATE LIMITING ====================
GLOBAL_RATE_LIMIT_PER_MINUTE=100
AUTH_RATE_LIMIT_PER_MINUTE=5
RESUME_UPLOAD_LIMIT=3
RESUME_MAX_FILE_SIZE_MB=10

# ==================== FRONTEND ====================
REACT_APP_FRONTEND_URL=http://localhost:3000
```

### For Docker Deployment

When using Docker Compose, set hosts to service names:
```
PG_DB_HOST=db
MINIO_HOST=minio
QDRANT_HOST=qdrant
GEN_REDIS_HOST=redis
A_CELERY_BROKER_HOST=redis
A_CELERY_BACKEND_HOST=redis
```

### For Local Development

When running services locally (without Docker):
```
PG_DB_HOST=localhost
MINIO_HOST=localhost
QDRANT_HOST=localhost
GEN_REDIS_HOST=localhost
A_CELERY_BROKER_HOST=localhost
A_CELERY_BACKEND_HOST=localhost
```

---

## 📡 API Documentation

### Base URL
- `http://localhost:8000`

### Health Check
```bash
curl http://localhost:8000/health
```

### Authentication Endpoints

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Register:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Resume Endpoints

**Upload Resume:**
```bash
curl -X POST http://localhost:8000/resume/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@resume.pdf"
```

**List Resumes:**
```bash
curl http://localhost:8000/resume/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Analyze Resume:**
```bash
curl -X POST http://localhost:8000/resume/analyze/ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Full API Docs
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 🔌 Services & Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **FastAPI** | 8000 | http://localhost:8000 | Main REST API |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **Redis** | 6379 | localhost:6379 | Cache & Celery broker |
| **Qdrant** | 6333 | http://localhost:6333 | Vector database API |
| **MinIO (S3)** | 9000 | http://localhost:9000 | Object storage API |
| **MinIO UI** | 9001 | http://localhost:9001 | MinIO dashboard |
| **PgAdmin** | 5050 | http://localhost:5050 | Database management |

---

## 🔍 Monitoring & Debugging

### View Container Logs

**All services:**
```bash
docker-compose logs -f
```

**Specific service:**
```bash
docker logs RA_BACKEND -f
docker logs RA_CELERY_WORKER -f
docker logs RA_CELERY_BEAT -f
docker logs RA_POSTGRES -f
```

### Database Debugging

**Connect to PostgreSQL:**
```bash
docker exec -it RA_POSTGRES psql -U postgres -d resume_db
```

**Common queries:**
```sql
-- List tables
\dt

-- View users
SELECT * FROM "User";

-- View resumes
SELECT * FROM "Resume";

-- View analysis
SELECT * FROM "Analysis";
```

### Check Service Health

```bash
# Test PostgreSQL
docker exec RA_POSTGRES pg_isready -U postgres

# Test Redis
docker exec RA_REDIS redis-cli ping

# Test Qdrant
curl http://localhost:6333/health

# Test MinIO
curl http://localhost:9000/minio/health/live

# Test FastAPI
curl http://localhost:8000/
```

### Docker Stats

```bash
# Monitor resource usage
docker stats
```

---

## 🐛 Troubleshooting

### Container Won't Start

**Problem:** Container exits immediately
```bash
# Check logs
docker logs RA_BACKEND

# Verify .env file exists
cat .env

# Check docker configuration
docker ps -a  # See exit codes
```

### FastAPI Not Responding

**Problem:** `curl http://localhost:8000` hangs or fails

```bash
# Check if port is in use
netstat -an | grep 8000  # Windows: netstat -ano | findstr :8000

# Check container logs
docker logs RA_BACKEND -f
```

### Celery Workers Not Processing Tasks

**Problem:** Tasks stuck in queue

```bash
# View worker logs
docker logs RA_CELERY_WORKER -f

# Inspect Redis queue
docker exec RA_REDIS redis-cli LLEN celery

# Restart worker
docker-compose restart celery-worker
```

### Database Connection Error

**Problem:** "Failed to connect to PostgreSQL"

```bash
# Check database is running
docker exec RA_POSTGRES pg_isready

# View PostgreSQL logs
docker logs RA_POSTGRES

# Restart database
docker-compose restart db
```

### Out of Memory

**Problem:** Container killed or processes sluggish

```bash
# Check resource limits
docker stats

# Increase Docker memory allocation in Docker Desktop settings
```

---

## 📁 Project Structure

```
RA2/
├── README.md                          # This file
├── .env                              # Environment variables
├── .gitignore
├── docker-compose.yml                # Docker Compose config
├── .dockerignore
│
├── Backend_Service/                  # FastAPI application
│   ├── pyproject.toml               # Backend dependencies
│   ├── alembic/                     # Database migrations
│   │   ├── env.py
│   │   ├── versions/                # Migration files
│   │   └── script.py.mako
│   │
│   └── backend/
│       ├── app.py                   # FastAPI app entry
│       ├── core/
│       │   ├── config.py            # Configuration
│       │   ├── security.py          # JWT, auth
│       │   ├── celery.py            # Celery config
│       │   └── redis.py             # Redis client
│       │
│       ├── api/
│       │   ├── controllers/         # Business logic
│       │   │   ├── auth_controller.py
│       │   │   ├── resume_controller.py
│       │   │   └── ...
│       │   ├── routers/             # API endpoints
│       │   │   ├── auth.py
│       │   │   ├── resume.py
│       │   │   ├── jobs.py
│       │   │   └── internal.py
│       │   ├── models/              # Request/Response
│       │   │   ├── auth_model.py
│       │   │   └── resume_model.py
│       │   ├── middlewares/         # Auth, rate limit
│       │   │   ├── jwt.py
│       │   │   ├── limiter.py
│       │   │   └── redis_cache.py
│       │   └── services/            # Service layer
│       │       ├── auth_services.py
│       │       ├── resume_services.py
│       │       └── user_services.py
│       │
│       ├── db/
│       │   ├── session.py           # DB connection
│       │   └── models/              # SQLAlchemy models
│       │       ├── Base.py
│       │       ├── User.py
│       │       ├── Resume.py
│       │       ├── Analysis.py
│       │       └── RefreshToken.py
│       │
│       ├── minio/
│       │   └── session.py           # MinIO client
│       │
│       └── qdrant/
│           └── session.py           # Qdrant client
│
├── AI_Service/                       # Celery workers
│   ├── pyproject.toml               # AI dependencies
│   ├── core/
│   │   └── config.py                # Configuration
│   │
│   ├── services/
│   │   ├── huggingface_service.py   # HF models
│   │   ├── qdrant_service.py        # Vector ops
│   │   ├── minio_service.py         # File storage
│   │   └── ...
│   │
│   ├── utils/
│   │   └── pdf_extractor.py         # PDF processing
│   │
│   └── workers/
│       ├── celery_app.py            # Celery config
│       └── tasks/
│           ├── resume_analyse.py    # Analysis task
│           ├── fetch_jobs.py        # Job fetching
│           ├── get_emmbedings.py    # Embedding gen
│           └── ...
│
├── Frontend_Service/                 # React/Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── Auth.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AnalysisDetails.jsx
│   │   │   └── ...
│   │   └── assets/
│   │
│   └── public/
│
└── Docker/                           # Docker utilities
    └── Dockerfile
```

---

## 📚 Key Files Explained

### `docker-compose.yml`
Orchestrates separate containers for each service. Best for development and complex deployments.

### `Backend_Service/alembic/versions/`
Database migration files. Run with:
```bash
alembic upgrade head
```

---

## 🔐 Security Considerations

### Production Checklist

- [ ] Change `BACKEND_SECRETE_KEY` to a strong random value
- [ ] Use strong passwords for all services
- [ ] Enable HTTPS/SSL certificates
- [ ] Set rate limiting appropriately
- [ ] Use secret management tools (AWS Secrets, Vault)
- [ ] Enable database backups
- [ ] Monitor logs and alerts
- [ ] Use private networks for services
- [ ] Rotate credentials regularly
- [ ] Use environment-specific .env files

---

## 📊 Performance Tuning

### Database Connection Pool
Edit `Backend_Service/backend/core/config.py`:
```python
pool_size=20
max_overflow=40
```

### Redis Memory
Edit `docker-compose.yml`:
```yaml
command: ["redis-server", "--maxmemory", "2gb", "--maxmemory-policy", "allkeys-lru"]
```

---

## 🆘 Getting Help

### Common Issues

1. **Port already in use**: Kill process or change port in compose file
2. **Permission denied**: Run Docker with `sudo` or add user to docker group
3. **Network error**: Check firewall, ensure docker network is running
4. **Database locked**: Restart PostgreSQL container
5. **Celery stuck**: Check Redis, restart workers

### Debug Mode

```bash
# Exec into backend container
docker exec -it RA_BACKEND bash
```

---

## 📝 License & Credits

Resume Analyzer - 2026

---

## 🤝 Support

For issues or questions:
1. Check logs: `docker logs <container_name>`
2. Review this README
3. Check specific service documentation

**Last Updated:** 2026-06-21
