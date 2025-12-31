# EMITHRAN - Manufacturing One-Stop Solution

Enterprise manufacturing One-Stop Solution for should-cost analysis, vendor management, and BOM processing.

## Architecture

```
Frontend (Next.js 16)  →  Backend API (NestJS)  →  PostgreSQL
     ↓                          ↓
Supabase Auth            Infrastructure
                         (Redis, RabbitMQ, MinIO)
```

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend API**: NestJS microservices (Port 4000)
- **Authentication**: Supabase
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Storage**: MinIO (S3-compatible)

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Supabase credentials and API URLs.

3. **Start infrastructure services**
   ```bash
   cd backend
   docker-compose up -d postgres redis rabbitmq minio
   ```

4. **Start backend API**
   ```bash
   cd backend/services/api-gateway
   npm install
   npm run start:dev
   ```

5. **Start frontend** (in root directory)
   ```bash
   npm run dev
   ```

6. **Access application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:4000
   - API Docs: http://localhost:4000/api/docs

## Development

### Project Structure
```
EMITHRAN/
├── backend/
│   ├── services/
│   │   ├── api-gateway/      # Main API gateway (Port 4000)
│   │   └── auth-service/     # Authentication service
│   └── docker-compose.yml    # Infrastructure services
├── src/
│   ├── app/                  # Next.js pages
│   ├── components/           # React components
│   └── lib/
│       ├── api/              # Backend API client
│       └── supabase/         # Supabase auth client
└── public/                   # Static assets
```

### API Client Usage

```typescript
import { useProjects, useCreateProject } from '@/lib/api/hooks';

function MyComponent() {
  const { data: projects } = useProjects();
  const createProject = useCreateProject();

  const handleCreate = () => {
    createProject.mutate({
      name: 'New Project',
      clientId: 'client-id',
    });
  };
}
```

### Available Services

| Service | Port | Status |
|---------|------|--------|
| Frontend | 3000 | ✅ Running |
| API Gateway | 4000 | ✅ Running |
| Auth Service | 4001 | ✅ Running |
| PostgreSQL | 5432 | ✅ Running |
| Redis | 6379 | ✅ Running |
| RabbitMQ | 5672 | ✅ Running |
| MinIO | 9000 | ✅ Running |

## Features

### Current
- ✅ User authentication (Supabase)
- ✅ Project management
- ✅ Vendor management
- ✅ Materials database
- ✅ BOM processing
- ✅ Cost analysis
- ✅ Real-time API with React Query
- ✅ Type-safe API client

### Coming Soon
- Analytics dashboard
- Advanced cost modeling
- Sourcing automation
- Export to Excel/PDF

## Tech Stack

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn UI, React Query
**Backend**: NestJS, TypeORM, PostgreSQL, Redis, RabbitMQ, MinIO
**Auth**: Supabase
**DevOps**: Docker, Docker Compose

## Security

- JWT authentication via Supabase
- CORS protection
- Rate limiting
- Input validation
- Helmet security headers
- SQL injection protection

## License

Proprietary and confidential.

---

**EMITHRAN Development Team**
# EMITHRAN
