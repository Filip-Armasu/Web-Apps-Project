const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = process.env.DB_FILE || 'database.sqlite';
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  // 1. Users Entity
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar TEXT
  )`);

 // 2. Movies Entity
db.run(`CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  director TEXT,
  release_year INTEGER,
  genre TEXT,
  description TEXT,
  poster_url TEXT,
  user_id INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

  // 3. Reviews Entity
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    user_id INTEGER,
    movie_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(movie_id) REFERENCES movies(id)
  )`);

  // Prevent duplicate reviews by the same user
db.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_movie
  ON reviews(user_id, movie_id)
`, (err) => {
  if (err) {
    console.error('Error creating review index:', err.message);
  }
});

  // 4. Watchlist Entity
  db.run(`CREATE TABLE IF NOT EXISTS user_movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('watchlist', 'watched')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, movie_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  )`);
});

module.exports = db;