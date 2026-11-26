const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('./auth');

router.use(requireAuth);

// 1. Get user's Watchlist and/or Collection: GET /api/watchlist?status=watchlist|watched
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT
      user_movies.id AS entry_id,
      user_movies.status,
      user_movies.created_at,
      movies.*
    FROM user_movies
    JOIN movies ON user_movies.movie_id = movies.id
    WHERE user_movies.user_id = ?
  `;
  const params = [req.user.id];

  if (status === 'watchlist' || status === 'watched') {
    sql += ' AND user_movies.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY user_movies.id DESC';

  db.all(sql, params, (err, items) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json({ items });
  });
});

// 2. Add to Watchlist (or set status): POST /api/watchlist
// Body: { "movie_id": 1, "status": "watchlist" } (status defaults to "watchlist")
router.post('/', (req, res) => {
  const movieId = Number(req.body.movie_id);
  const status = req.body.status || 'watchlist';

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Valid movie_id is required.' });
  }
  if (status !== 'watchlist' && status !== 'watched') {
    return res.status(400).json({ error: 'Status must be "watchlist" or "watched".' });
  }

  // Verify movie exists in shared catalog
  db.get('SELECT id FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    const sql = `
      INSERT INTO user_movies (user_id, movie_id, status)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, movie_id)
      DO UPDATE SET status = excluded.status
    `;

    db.run(sql, [req.user.id, movieId, status], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      db.get(
        'SELECT * FROM user_movies WHERE user_id = ? AND movie_id = ?',
        [req.user.id, movieId],
        (err, entry) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          return res.status(201).json({ item: entry });
        }
      );
    });
  });
});

// 3. Mark as Watched (move from Watchlist to Collection): PATCH /api/watchlist/:movieId
// Body: { "status": "watched" }
router.patch('/:movieId', (req, res) => {
  const movieId = Number(req.params.movieId);
  const { status } = req.body;

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Valid movieId is required.' });
  }
  if (status !== 'watchlist' && status !== 'watched') {
    return res.status(400).json({ error: 'Status must be "watchlist" or "watched".' });
  }

  db.run(
    'UPDATE user_movies SET status = ? WHERE user_id = ? AND movie_id = ?',
    [status, req.user.id, movieId],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Movie not found in your list.' });
      }

      db.get(
        'SELECT * FROM user_movies WHERE user_id = ? AND movie_id = ?',
        [req.user.id, movieId],
        (err, updated) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          return res.status(200).json({ item: updated });
        }
      );
    }
  );
});

// 4. Remove from personal list only (does NOT delete from movies): DELETE /api/watchlist/:movieId
router.delete('/:movieId', (req, res) => {
  const movieId = Number(req.params.movieId);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Valid movieId is required.' });
  }

  db.run(
    'DELETE FROM user_movies WHERE user_id = ? AND movie_id = ?',
    [req.user.id, movieId],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Movie not found in your list.' });
      }
      return res.status(200).json({ message: 'Removed from your list.' });
    }
  );
});

module.exports = router;