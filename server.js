const express = require('express');
const { MongoClient } = require('mongodb');
const morgan = require('morgan'); // HTTP request logger middleware
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const cors = require('cors'); // CORS middleware
const app = express();
const port = 3000;

const uri = "mongodb+srv://tanwir1703:PomRuHTlPOiAJpd8@cluster0.gtj28dg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function startServer() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const database = client.db('AudioDB');
    const booksCollection = database.collection('Books');

    // Middleware setup
    app.use(morgan('combined')); // Log HTTP requests
    app.use(bodyParser.json()); // Parse JSON request bodies
    app.use(cors()); // Enable CORS

    // Endpoint to get all books
    app.get('/books', async (req, res) => {
      try {
        const books = await booksCollection.find().toArray();
        res.json(books);
      } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).send('Error fetching books');
      }
    });

    // App running
    app.get('/', async (req, res) => {
        res.json({message : "Application is running now"})
    })

    // Endpoint to get a book by ID
    app.get('/books/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const book = await booksCollection.findOne({ id: parseInt(id) });
        if (book) {
          res.json(book);
        } else {
          res.status(404).send('Book not found');
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).send('Error fetching book');
      }
    });

    // Endpoint to post a review for a book by ID
    app.post('/books/:id/review', async (req, res) => {
        try {
          const id = req.params.id;
          const { score, review } = req.body;
  
          if (typeof score !== 'number' || typeof review !== 'string' || score < 1 || score > 5) {
            return res.status(400).send('Invalid score or review');
          }
  
          const updateResult = await booksCollection.updateOne(
            { id: parseInt(id) },
            { $push: { rating: { score, review } } }
          );
  
          if (updateResult.modifiedCount === 1) {
            res.send('Review added successfully');
          } else {
            res.status(404).send('Book not found');
          }
        } catch (error) {
          console.error('Error adding review:', error);
          res.status(500).send('Error adding review');
        }
      });

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
}

startServer();
