import express, { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../database/database';
import { Book, CreateBookRequest, UpdateBookRequest, BookFilters } from '../models/Book';
import { validateCreateBook, validateUpdateBook, validateBookId } from '../middleware/validation';

const router = express.Router();

// GET /api/books - List all books with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { title, author, genre, limit = '50', offset = '0' }: any = req.query;
    
    let query = 'SELECT * FROM books';
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Add filters if provided
    if (title) {
      conditions.push('title LIKE ?');
      params.push(`%${title}%`);
    }
    
    if (author) {
      conditions.push('author LIKE ?');
      params.push(`%${author}%`);
    }
    
    if (genre) {
      conditions.push('genre LIKE ?');
      params.push(`%${genre}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    // Add pagination
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    
    if (!isNaN(limitNum) && limitNum > 0) {
      query += ' LIMIT ?';
      params.push(limitNum);
    }
    
    if (!isNaN(offsetNum) && offsetNum >= 0) {
      query += ' OFFSET ?';
      params.push(offsetNum);
    }
    
    const books = await dbAll(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM books';
    const countParams: any[] = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      // Add the same filter parameters for count query
      if (title) countParams.push(`%${title}%`);
      if (author) countParams.push(`%${author}%`);
      if (genre) countParams.push(`%${genre}%`);
    }
    
    const countResult = await dbGet(countQuery, countParams);
    const total = countResult.total;
    
    res.json({
      data: books,
      pagination: {
        total,
        limit: limitNum || total,
        offset: offsetNum || 0,
        hasMore: (offsetNum || 0) + (limitNum || total) < total
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/books/:id - Get a specific book by ID
router.get('/:id', validateBookId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const book = await dbGet('SELECT * FROM books WHERE id = ?', [id]);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json({ data: book });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/books - Create a new book
router.post('/', validateCreateBook, async (req: Request, res: Response) => {
  try {
    const { title, author, isbn, publishedYear, genre, description }: CreateBookRequest = req.body;
    
    const result = await dbRun(
      'INSERT INTO books (title, author, isbn, publishedYear, genre, description) VALUES (?, ?, ?, ?, ?, ?)',
      [title, author, isbn || null, publishedYear || null, genre || null, description || null]
    );
    
    const newBook = await dbGet('SELECT * FROM books WHERE id = ?', [result.lastID]);
    
    res.status(201).json({ 
      message: 'Book created successfully',
      data: newBook 
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/books/:id - Update a book
router.put('/:id', validateBookId, validateUpdateBook, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, publishedYear, genre, description }: UpdateBookRequest = req.body;
    
    // Check if book exists
    const existingBook = await dbGet('SELECT * FROM books WHERE id = ?', [id]);
    
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title);
    }
    
    if (author !== undefined) {
      updateFields.push('author = ?');
      updateParams.push(author);
    }
    
    if (isbn !== undefined) {
      updateFields.push('isbn = ?');
      updateParams.push(isbn);
    }
    
    if (publishedYear !== undefined) {
      updateFields.push('publishedYear = ?');
      updateParams.push(publishedYear);
    }
    
    if (genre !== undefined) {
      updateFields.push('genre = ?');
      updateParams.push(genre);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(id);
    
    const updateQuery = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await dbRun(updateQuery, updateParams);
    
    const updatedBook = await dbGet('SELECT * FROM books WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Book updated successfully',
      data: updatedBook 
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/books/:id - Delete a book
router.delete('/:id', validateBookId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if book exists
    const existingBook = await dbGet('SELECT * FROM books WHERE id = ?', [id]);
    
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    await dbRun('DELETE FROM books WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Book deleted successfully',
      data: existingBook 
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
