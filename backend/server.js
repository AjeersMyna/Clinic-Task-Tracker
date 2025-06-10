// backend/server.js

const express = require('express');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db'); // Import the database connection
const { notFound, errorHandler } = require('./middleware/errorMiddleware'); // Import error handling middleware
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes'); // Assuming you have userRoutes
const cors = require('cors'); // <--- ADD THIS LINE

// Connect to MongoDB
connectDB();

const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json()); // Allows parsing of JSON data in the request body
app.use(express.urlencoded({ extended: false })); // Allows parsing of URL-encoded data in the request body

// <--- ADD CORS MIDDLEWARE HERE
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests only from your frontend's origin
    credentials: true // Allow cookies/authorization headers to be sent
}));

// Basic route to check if the server is running
app.get('/', (req, res) => {
    res.send('Clinic Task Tracker API is running!');
});

// Task Routes
app.use('/api/tasks', taskRoutes);

// User Routes
app.use('/api/users', userRoutes); // Assuming this route exists

// Error handling middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));