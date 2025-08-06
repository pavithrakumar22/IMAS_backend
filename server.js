import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import combinedRoutes from './api/routes/combined.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/combined', combinedRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: "Node is alive" }));

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
