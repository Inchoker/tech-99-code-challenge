# Problem 5: Book Management CRUD Backend Server

A RESTful CRUD backend server for managing books, built with ExpressJS and TypeScript.

## Features

- Full CRUD operations for books (Create, Read, Update, Delete)
- TypeScript for type safety
- SQLite database for data persistence
- RESTful API endpoints
- Input validation and data sanitization
- Error handling
- CORS support
- Security headers with Helmet
- Request logging with Morgan
- Advanced filtering and pagination

## API Endpoints

### Books

- `GET /api/books` - List all books with optional filters
- `GET /api/books/:id` - Get a specific book by ID
- `POST /api/books` - Create a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book

## Book Schema

```typescript
interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Usage

The server will start on port 3000 (or the port specified in the PORT environment variable).

### Example requests:

**Create a book:**
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "publishedYear": 1925,
    "genre": "Fiction",
    "description": "A classic American novel about the Jazz Age"
  }'
```

**Get all books:**
```bash
curl http://localhost:3000/api/books
```

**Get books with filters:**
```bash
# Filter by author
curl "http://localhost:3000/api/books?author=Fitzgerald"

# Filter by genre
curl "http://localhost:3000/api/books?genre=Fiction"

# Filter by title
curl "http://localhost:3000/api/books?title=Gatsby"

# Pagination
curl "http://localhost:3000/api/books?limit=10&offset=0"
```

**Get a specific book:**
```bash
curl http://localhost:3000/api/books/1
```

**Update a book:**
```bash
curl -X PUT http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby (Updated Edition)",
    "description": "A classic American novel about the Jazz Age - Updated edition"
  }'
```

**Delete a book:**
```bash
curl -X DELETE http://localhost:3000/api/books/1
```

## Database

The application uses SQLite for data persistence. The database file (`database.sqlite`) will be created automatically when the server starts with the following schema:

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  publishedYear INTEGER,
  genre TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Validation

The API includes comprehensive validation:
- **title**: Required, non-empty string
- **author**: Required, non-empty string
- **isbn**: Optional string
- **publishedYear**: Optional number, must be a valid year
- **genre**: Optional string
- **description**: Optional string

## Project Structure

```
src/
├── index.ts          # Main server entry point
├── models/           # Data models
│   └── Book.ts
├── routes/           # API route handlers
│   └── books.ts
├── database/         # Database configuration
│   └── database.ts
└── middleware/       # Custom middleware
    └── validation.ts
```
