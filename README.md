# Notes API

A simple JWT-protected notes API built with Node.js, Express, TypeScript, and SQLite.

## Features

- 🔐 JWT-based authentication
- 📝 CRUD operations for notes
- 🗄️ SQLite database with better-sqlite3
- 📚 OpenAPI/Swagger documentation
- 🐳 Docker support
- ✅ Comprehensive test suite
- 🔒 User isolation (users can only access their own notes)

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd notes-api
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred values
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **View API documentation:**
   - Swagger UI: http://localhost:3000/docs
   - OpenAPI JSON: http://localhost:3000/openapi.json

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=dev-secret-change-me
DB_PATH=db/app.db
NODE_ENV=development
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret key for JWT signing | `dev-secret-change-me` |
| `DB_PATH` | SQLite database file path | `db/app.db` |
| `NODE_ENV` | Environment mode | `development` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run test suite |

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1
}
```

### Notes (Protected Routes)

All note endpoints require the `Authorization: Bearer <token>` header.

#### List Notes
```http
GET /notes
Authorization: Bearer <token>
```

#### Create Note
```http
POST /notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "My first note!"
}
```

#### Delete Note
```http
DELETE /notes/{id}
Authorization: Bearer <token>
```

### Health Check

```http
GET /health
```

## Testing

Run the test suite:

```bash
npm test
```

The tests use an in-memory SQLite database and cover:
- User registration and authentication
- Note CRUD operations
- Authorization (users can only access their own notes)
- Error handling

## Docker

### Using Docker Compose (Recommended)

```bash
# Build and start the service
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop the service
docker-compose down
```

### Using Docker directly

```bash
# Build the image
docker build -t notes-api .

# Run the container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret-key \
  -e DB_PATH=/data/app.db \
  -v notes_data:/data \
  notes-api
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Notes Table
```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Project Structure

```
├── src/
│   ├── middleware/
│   │   ├── auth.ts          # JWT authentication middleware
│   │   └── errorHandler.ts  # Central error handling
│   ├── routes/
│   │   ├── auth.ts          # Authentication routes
│   │   └── notes.ts         # Notes CRUD routes
│   ├── schemas.ts           # Zod validation schemas
│   └── server.ts            # Express app setup
├── db/
│   └── index.ts             # Database setup and helpers
├── tests/
│   └── auth-and-notes.test.ts # Test suite
├── openapi.yaml             # OpenAPI specification
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile              # Docker image definition
└── package.json            # Dependencies and scripts
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- User isolation (users can only access their own data)
- Input validation with Zod
- SQL injection protection with parameterized queries
- CORS-ready (can be easily added)

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Adding New Features

1. Create new routes in `src/routes/`
2. Add validation schemas in `src/schemas.ts`
3. Update the OpenAPI specification in `openapi.yaml`
4. Add tests in `tests/`
5. Update this README

### Database Migrations

For production deployments, consider adding a migration system to handle database schema changes.

## License

MIT License - see LICENSE file for details.