// Find all books in a specific genre
db.books.find({ genre: "Classic" })

// Find books published after a certain year
db.books.find({ published_year: { $gt: 2010 } })

// Find books by a specific author
db.books.find({ author: "F. Scott Fitzgerald" })

// Update the price of a specific book
db.books.updateOne(
  { title: "The Great Gatsby" },
  { $set: { price: 14.99 } }
)

// Delete a book by its title
db.books.deleteOne({ title: "To Kill a Mockingbird" })
db.books.find()