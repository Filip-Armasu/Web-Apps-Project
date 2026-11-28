const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('./auth');
router.use(requireAuth);

function isValidPosterUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return true; // treated as optional / null

  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//');
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// 1. CREATE: POST /api/movies
router.post('/', (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Only admins can add movies.' });
  }

  const { title, director, release_year, genre, description, poster_url } = req.body;

  if (!title || String(title).trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  let parsedYear = null;
  if (release_year !== undefined && release_year !== null && String(release_year).trim() !== '') {
    const yearNum = Number(release_year);
    const maxYear = new Date().getFullYear() + 5;
    if (!Number.isInteger(yearNum) || yearNum < 1888 || yearNum > maxYear) {
      return res.status(400).json({ error: `Release year must be a valid integer between 1888 and ${maxYear}.` });
    }
    parsedYear = yearNum;
  }

  const cleanString = (val) => {
    if (val === undefined || val === null) return null;
    if (typeof val !== 'string') return Symbol('invalid');
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
  };

  const cleanDirector = cleanString(director);
  const cleanGenre = cleanString(genre);
  const cleanDescription = cleanString(description);

  if ([cleanDirector, cleanGenre, cleanDescription].some((v) => typeof v === 'symbol')) {
    return res.status(400).json({ error: 'Director, genre, and description must be text.' });
  }

  let cleanPosterUrl = null;
  if (poster_url !== undefined && poster_url !== null) {
    if (!isValidPosterUrl(poster_url)) {
      return res.status(400).json({ error: 'Poster URL must be a valid http or https URL.' });
    }
    const trimmedPoster = String(poster_url).trim();
    cleanPosterUrl = trimmedPoster === '' ? null : trimmedPoster;
  }

  const sql = `
    INSERT INTO movies (title, director, release_year, genre, description, poster_url, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    String(title).trim(),
    cleanDirector,
    parsedYear,
    cleanGenre,
    cleanDescription,
    cleanPosterUrl,
    req.user.id,
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

// 2. READ: GET /api/movies (public catalog)
router.get('/', (req, res) => {
  const { search, genre } = req.query;

  // Validate query parameters
  if (search !== undefined && typeof search !== 'string') {
    return res.status(400).json({
      error: 'Search must be a text value.'
    });
  }

  if (genre !== undefined && typeof genre !== 'string') {
    return res.status(400).json({
      error: 'Genre must be a text value.'
    });
  }

  // Shared movie catalog
  let sql = 'SELECT * FROM movies WHERE 1 = 1';
  const params = [];

  // Search by movie title
  if (search && search.trim()) {
    sql += ' AND instr(LOWER(title), LOWER(?)) > 0';
    params.push(search.trim());
  }

  // Filter by genre
  if (
    genre &&
    genre.trim() &&
    genre.trim().toLowerCase() !== 'all'
  ) {
    sql += `
      AND instr(
        '/' || LOWER(REPLACE(genre, ' ', '')) || '/',
        '/' || LOWER(REPLACE(?, ' ', '')) || '/'
      ) > 0
    `;
    params.push(genre.trim());
  }

  // Keep the original movie order
  sql += ' ORDER BY id ASC';

  db.all(sql, params, (err, movies) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({
        error: 'Internal server error.'
      });
    }

    const formattedMovies = movies.map((movie) => ({
      ...movie,
      poster_url: movie.poster_url && movie.poster_url.trim() !== '' ? movie.poster_url.trim() : null
    }));

    return res.status(200).json({ movies: formattedMovies });
  });
});

// 3. UPDATE: PATCH /api/movies/:id
router.patch('/:id', (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  const movieId = Number(req.params.id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Invalid movie ID.' });
  }

  const { title, director, release_year, genre, description, poster_url } = req.body;

  db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    let updatedTitle = movie.title;
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title must be a non-empty string.' });
      }
      updatedTitle = title.trim();
    }

    let updatedYear = movie.release_year;
    if (release_year !== undefined) {
      if (release_year === null || String(release_year).trim() === '') {
        updatedYear = null;
      } else {
        const yearNum = Number(release_year);
        const maxYear = new Date().getFullYear() + 5;
        if (!Number.isInteger(yearNum) || yearNum < 1888 || yearNum > maxYear) {
          return res.status(400).json({
            error: `Release year must be a valid integer between 1888 and ${maxYear}.`
          });
        }
        updatedYear = yearNum;
      }
    }

    const cleanOptionalText = (val, currentVal) => {
      if (val === undefined) return { ok: true, value: currentVal };
      if (val === null) return { ok: true, value: null };
      if (typeof val !== 'string') return { ok: false };
      const trimmed = val.trim();
      return { ok: true, value: trimmed === '' ? null : trimmed };
    };

    const dirRes = cleanOptionalText(director, movie.director);
    const genreRes = cleanOptionalText(genre, movie.genre);
    const descRes = cleanOptionalText(description, movie.description);

    if (!dirRes.ok || !genreRes.ok || !descRes.ok) {
      return res.status(400).json({ error: 'Optional fields must be text or null.' });
    }

    let updatedPosterUrl = movie.poster_url ?? null;
    if (poster_url !== undefined) {
      if (poster_url === null || (typeof poster_url === 'string' && poster_url.trim() === '')) {
        updatedPosterUrl = null;
      } else if (typeof poster_url === 'string') {
        const trimmedUrl = poster_url.trim();
        try {
          const parsed = new URL(trimmedUrl);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return res.status(400).json({ error: 'Poster URL must use http or https.' });
          }
          updatedPosterUrl = trimmedUrl;
        } catch {
          return res.status(400).json({ error: 'Poster URL must be a valid URL.' });
        }
      } else {
        return res.status(400).json({ error: 'Poster URL must be a valid URL or null.' });
      }
    }

    const updateSql = `
      UPDATE movies
      SET title = ?, director = ?, release_year = ?, genre = ?, description = ?, poster_url = ?
      WHERE id = ?
    `;

    db.run(
      updateSql,
      [
        updatedTitle,
        dirRes.value,
        updatedYear,
        genreRes.value,
        descRes.value,
        updatedPosterUrl,
        movieId
      ],
      function (updateErr) {
        if (updateErr) {
          console.error(updateErr);
          return res.status(500).json({ error: 'Internal server error' });
        }

        db.get('SELECT * FROM movies WHERE id = ?', [movieId], (selectErr, updatedMovie) => {
          if (selectErr) {
            console.error(selectErr);
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
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  const movieId = Number(req.params.id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Invalid movie ID.' });
  }

  db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    db.run('DELETE FROM movies WHERE id = ?', [movieId], function (deleteErr) {
      if (deleteErr) {
        console.error(deleteErr);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Movie not found.' });
      }

      return res.status(200).json({ message: 'Movie deleted successfully.' });
    });
  });
});

// Create a review: POST /api/movies/:id/reviews
router.post('/:id/reviews', (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const movieId = Number(req.params.id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Invalid movie ID.' });
  }
  const { rating: ratingNumber, comment: rawComment } =
  req.body || {};

  if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  if (rawComment !== undefined && rawComment !== null && typeof rawComment !== 'string') {
    return res.status(400).json({ error: 'Comment must be a string.' });
  }

 // Validate the original comment length
if (
  typeof rawComment === 'string' &&
  rawComment.length > 1000
) {
  return res.status(400).json({
    error: 'Comment must be 1000 characters or fewer.'
  });
}

// Sanitize the comment
const cleanedComment =
  typeof rawComment === 'string'
    ? rawComment.trim().replace(/[<>]/g, '')
    : '';

const sanitizedComment =
  cleanedComment.length > 0 ? cleanedComment : null;

  // Verify the target movie exists
  db.get('SELECT id FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    const watchedSql = `
      SELECT id FROM user_movies
      WHERE user_id = ? AND movie_id = ? AND status = 'watched'
    `;

    db.get(watchedSql, [req.user.id, movieId], (err, watchedEntry) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!watchedEntry) {
        return res.status(403).json({
          error: 'You can only review movies you have marked as watched.'
        });
      }

      const insertSql = `
        INSERT INTO reviews (movie_id, user_id, rating, comment)
        VALUES (?, ?, ?, ?)
      `;

      db.run(insertSql, [movieId, req.user.id, ratingNumber, sanitizedComment], function (err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'You have already reviewed this movie.' });
          }
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
});

// Read reviews for a movie: GET /api/movies/:id/reviews
router.get('/:id/reviews', (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const movieId = Number(req.params.id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Invalid movie ID.' });
  }

  db.get('SELECT id FROM movies WHERE id = ?', [movieId], (err, movie) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

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
});

module.exports = router;