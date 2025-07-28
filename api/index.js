import express from 'express';
import serverless from 'serverless-http';

const app = express();

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express on Vercel!' });
});

// Export the serverless handler
export default serverless(app);
