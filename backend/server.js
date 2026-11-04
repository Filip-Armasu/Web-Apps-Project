const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import and mount authentication routes
const { router: authRouter } = require('./routes/auth');
app.use('/api', authRouter);

// test route
app.get('/', (req, res) => {
  res.json({ message: "Movie Watchlist API is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

