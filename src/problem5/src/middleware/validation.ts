import { Request, Response, NextFunction } from 'express';
import { CreateBookRequest, UpdateBookRequest } from '../models/Book';

export const validateCreateBook = (req: Request, res: Response, next: NextFunction) => {
  const { title, author, isbn, publishedYear, genre, description }: CreateBookRequest = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Title is required and must be a non-empty string' 
    });
  }

  if (!author || typeof author !== 'string' || author.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Author is required and must be a non-empty string' 
    });
  }

  if (isbn && typeof isbn !== 'string') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'ISBN must be a string' 
    });
  }

  if (publishedYear && (typeof publishedYear !== 'number' || publishedYear < 0 || publishedYear > new Date().getFullYear())) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Published year must be a valid year' 
    });
  }

  if (genre && typeof genre !== 'string') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Genre must be a string' 
    });
  }

  if (description && typeof description !== 'string') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Description must be a string' 
    });
  }

  // Trim and normalize data
  req.body.title = title.trim();
  req.body.author = author.trim();
  if (isbn) req.body.isbn = isbn.trim();
  if (genre) req.body.genre = genre.trim();
  if (description) req.body.description = description.trim();

  next();
};

export const validateUpdateBook = (req: Request, res: Response, next: NextFunction) => {
  const { title, author, isbn, publishedYear, genre, description }: UpdateBookRequest = req.body;

  // At least one field must be provided for update
  if (!title && !author && !isbn && !publishedYear && !genre && !description) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'At least one field must be provided for update' 
    });
  }

  if (title && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Title must be a non-empty string' 
    });
  }

  if (author && (typeof author !== 'string' || author.trim().length === 0)) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Author must be a non-empty string' 
    });
  }

  if (isbn && typeof isbn !== 'string') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'ISBN must be a string' 
    });
  }

  if (publishedYear && (typeof publishedYear !== 'number' || publishedYear < 0 || publishedYear > new Date().getFullYear())) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Published year must be a valid year' 
    });
  }

  if (genre && typeof genre !== 'string') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Genre must be a string' 
    });
  }

  if (description && typeof description !== 'string') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Description must be a string' 
    });
  }

  // Trim and normalize data
  if (title) req.body.title = title.trim();
  if (author) req.body.author = author.trim();
  if (isbn) req.body.isbn = isbn.trim();
  if (genre) req.body.genre = genre.trim();
  if (description) req.body.description = description.trim();

  next();
};

export const validateBookId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId) || numericId <= 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      message: 'Book ID must be a positive integer' 
    });
  }

  req.params.id = numericId.toString();
  next();
};
