// Connect to database
const conn = new Mongo();
const db = conn.getDB("plp_bookstore");

// Insert sample data
db.books.insertMany([
  {
    title: "16 UNDENIABLE LAWS OF COMMUNICATION",
    author: "JOHN C. MAXWELL",
    genre: "Self-Help",
    published_year: 2025,
    price: 12.99,
    in_stock: true,
    pages: 180,
    publisher: "Thomas Nelson",
  },
  // Add more books here...
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    published_year: 1925,
    price: 10.99,
    in_stock: true,
    pages: 180,
    publisher: "Scribner",
  },
    {
        title: "To Kill a Mockingbird", 
        author: "Harper Lee",
        genre: "Classic",
        published_year: 1960,
        price: 7.99,
        in_stock: true,
        pages: 281,
        publisher: "J.B. Lippincott & Co."
    }
]);

print("Books inserted successfully");