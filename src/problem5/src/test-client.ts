import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/books';

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

class BookClient {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async createBook(book: { title: string; author: string; isbn?: string; publishedYear?: number; genre?: string; description?: string }): Promise<Book> {
    try {
      const response = await axios.post(this.baseUrl, book);
      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to create book: ${error.response?.data?.error || error.message}`);
    }
  }

  async getBooks(filters?: { title?: string; author?: string; genre?: string; limit?: number; offset?: number }): Promise<{ data: Book[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters?.title) params.append('title', filters.title);
      if (filters?.author) params.append('author', filters.author);
      if (filters?.genre) params.append('genre', filters.genre);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get books: ${error.response?.data?.error || error.message}`);
    }
  }

  async getBook(id: number): Promise<Book> {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to get book: ${error.response?.data?.error || error.message}`);
    }
  }

  async updateBook(id: number, updates: { title?: string; author?: string; isbn?: string; publishedYear?: number; genre?: string; description?: string }): Promise<Book> {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, updates);
      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to update book: ${error.response?.data?.error || error.message}`);
    }
  }

  async deleteBook(id: number): Promise<Book> {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to delete book: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Example usage and test functions
const testApi = async () => {
  const client = new BookClient();

  try {
    console.log('� Testing Book CRUD API...\n');

    // Create books
    console.log('1. Creating books...');
    const book1 = await client.createBook({
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      publishedYear: 1925,
      genre: 'Fiction',
      description: 'A classic American novel about the Jazz Age'
    });
    
    const book2 = await client.createBook({
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-28423-4',
      publishedYear: 1949,
      genre: 'Dystopian Fiction',
      description: 'A dystopian social science fiction novel'
    });
    
    const book3 = await client.createBook({
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      publishedYear: 1960,
      genre: 'Fiction',
      description: 'A novel about racial injustice and childhood innocence'
    });
    
    console.log('✅ Created books:', { book1, book2, book3 });

    // Get all books
    console.log('\n2. Getting all books...');
    const allBooks = await client.getBooks();
    console.log('✅ All books:', allBooks);

    // Get books with filters
    console.log('\n3. Getting books with author filter...');
    const filteredBooks = await client.getBooks({ author: 'Orwell' });
    console.log('✅ Filtered books:', filteredBooks);

    console.log('\n4. Getting books with genre filter...');
    const fictionBooks = await client.getBooks({ genre: 'Fiction' });
    console.log('✅ Fiction books:', fictionBooks);

    // Get single book
    console.log('\n5. Getting single book...');
    const singleBook = await client.getBook(book1.id);
    console.log('✅ Single book:', singleBook);

    // Update book
    console.log('\n6. Updating book...');
    const updatedBook = await client.updateBook(book1.id, {
      title: 'The Great Gatsby (Updated Edition)',
      description: 'A classic American novel about the Jazz Age - Updated edition with new foreword'
    });
    console.log('✅ Updated book:', updatedBook);

    // Delete book
    console.log('\n7. Deleting book...');
    const deletedBook = await client.deleteBook(book2.id);
    console.log('✅ Deleted book:', deletedBook);

    // Verify deletion
    console.log('\n8. Verifying remaining books...');
    const remainingBooks = await client.getBooks();
    console.log('✅ Remaining books:', remainingBooks);

    console.log('\n🎉 All book API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  // Wait a bit for the server to start up
  setTimeout(testApi, 2000);
}

export { BookClient, testApi };
