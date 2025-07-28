import express from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Middleware (optional, can add body parsers etc.)
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('✅ IMAS Backend is running!');
});

// Set port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
