const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// test route
app.get('/', (req, res) => {
  res.json({ message: "Movie Watchlist API is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  // logic and pass hash here
  res.status(201).json({ message: "User registered successfully" });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  // logic here
  res.status(200).json({ message: "Login successful" });
});