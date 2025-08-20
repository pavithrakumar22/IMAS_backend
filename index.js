import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import combinedRoutes from './api/routes/combined.js';
import mongoose from 'mongoose';
import authRoutes from './api/routes/authRoutes.js';
import { spawn } from 'child_process';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

process.env.TF_ENABLE_ONEDNN_OPTS = '0';

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/combined', combinedRoutes);

app.get('/health', (req, res) => res.json({ status: "Node is alive" }));

const runPythonScript = () => {
  const pythonProcess = spawn('python', ['Agents\\Translation\\translate.py']);

  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);

    if (output.includes("Running on http://127.0.0.1:8000")) {
      console.log("Python Server running....");
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Python script executed successfully');
    } else {
      console.error(`Python script failed with code ${code}`);
    }
  });
};

runPythonScript();

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on http://localhost:5000");
});
