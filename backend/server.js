const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Import and mount authentication routes
const { router: authRouter } = require('./routes/auth');
app.use('/api', authRouter);

const moviesRouter = require('./routes/movies');
app.use('/api/movies', moviesRouter);

const reviewsRouter = require('./routes/reviews');
app.use('/api/reviews', reviewsRouter);

// test route
app.get('/', (req, res) => {
  res.json({ message: "Movie Watchlist API is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

