import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import combinedRoutes from './api/routes/combined.js';
import mongoose from 'mongoose';
import authRoutes from './api/routes/authRoutes.js'

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/combined', combinedRoutes);

app.get('/health', (req, res) => res.json({ status: "Node is alive" }));

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on http://localhost:5000");
});
