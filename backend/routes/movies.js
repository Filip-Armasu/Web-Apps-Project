const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('./auth');

// Protect all movie routes with cookie-reading auth middleware
router.use(requireAuth);

// 1. CREATE: POST /api/movies
router.post('/', (req, res) => {
  const { title, director, release_year, genre, description } = req.body;

  if (!title || String(title).trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  const sql = `
    INSERT INTO movies (title, director, release_year, genre, description, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    String(title).trim(),
    director || null,
    release_year || null,
    genre || null,
    description || null,
    req.user.id
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    db.get('SELECT * FROM movies WHERE id = ?', [this.lastID], (err, movie) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      return res.status(201).json({ movie });
    });
  });
});

// 2. READ: GET /api/movies
router.get('/', (req, res) => {
  const { genre } = req.query;
  let sql = 'SELECT * FROM movies WHERE user_id = ?';
  const params = [req.user.id];

  if (genre) {
    sql += ' AND genre = ?';
    params.push(genre);
  }

  db.all(sql, params, (err, movies) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json({ movies });
  });
});

// 3. UPDATE: PATCH /api/movies/:id
router.patch('/:id', (req, res) => {
  const movieId = req.params.id;
  const { title, director, release_year, genre, description } = req.body;

  db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }
    if (movie.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You do not own this movie.' });
    }

    const updatedTitle = title !== undefined ? String(title).trim() : movie.title;
    if (!updatedTitle) {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }

    const updatedDirector = director !== undefined ? director : movie.director;
    const updatedYear = release_year !== undefined ? release_year : movie.release_year;
    const updatedGenre = genre !== undefined ? genre : movie.genre;
    const updatedDescription = description !== undefined ? description : movie.description;

    const updateSql = `
      UPDATE movies
      SET title = ?, director = ?, release_year = ?, genre = ?, description = ?
      WHERE id = ? AND user_id = ?
    `;

    db.run(
      updateSql,
      [updatedTitle, updatedDirector, updatedYear, updatedGenre, updatedDescription, movieId, req.user.id],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, updatedMovie) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          return res.status(200).json({ movie: updatedMovie });
        });
      }
    );
  });
});

// 4. DELETE: DELETE /api/movies/:id
router.delete('/:id', (req, res) => {
  const movieId = req.params.id;

  db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }
    if (movie.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You do not own this movie.' });
    }

    db.run('DELETE FROM movies WHERE id = ? AND user_id = ?', [movieId, req.user.id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      return res.status(200).json({ message: 'Movie deleted successfully.' });
    });
  });
});


  // Create a review: POST /api/movies/:id/reviews
router.post('/:id/reviews', (req, res) => {
  const movieId = req.params.id;
  const ratingNumber = Number(req.body.rating);
  const rawComment = req.body.comment;

  if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  const sanitizedComment =
    typeof rawComment === 'string'
      ? rawComment.trim().replace(/[<>]/g, '')
      : null;

  // Verify the target movie exists
  db.get('SELECT id FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    const insertSql = `
      INSERT INTO reviews (movie_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;

    db.run(insertSql, [movieId, req.user.id, ratingNumber, sanitizedComment], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      db.get('SELECT * FROM reviews WHERE id = ?', [this.lastID], (err, review) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        return res.status(201).json({ review });
      });
    });
  });
});

// Read reviews for a movie: GET /api/movies/:id/reviews
router.get('/:id/reviews', (req, res) => {
  const movieId = req.params.id;

  const sql = `
    SELECT reviews.*, users.username
    FROM reviews
    JOIN users ON reviews.user_id = users.id
    WHERE reviews.movie_id = ?
    ORDER BY reviews.id DESC
  `;

  db.all(sql, [movieId], (err, reviews) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json({ reviews });
  });
});

module.exports = router;