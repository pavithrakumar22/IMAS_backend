import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import combinedRoutes from './api/routes/combined.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/combined', combinedRoutes);

app.get('/health', (req, res) => res.json({ status: "Node is alive" }));

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on http://localhost:5000");
});
