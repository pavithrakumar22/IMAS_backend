import express from 'express';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ IMAS backend (ESM) running on Vercel');
});

app.post('/classify', (req, res) => {
  const { message } = req.body;
  res.json({ category: 'low', original: message });
});

// Export as a Vercel-compatible function
export const handler = serverless(app);
