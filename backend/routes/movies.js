const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('./auth');
router.use(requireAuth);

// 1. CREATE: POST /api/movies
router.post('/', (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { title, director, release_year, genre, description } = req.body;

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

  const sql = `
    INSERT INTO movies (title, director, release_year, genre, description, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    String(title).trim(),
    cleanDirector,
    parsedYear,
    cleanGenre,
    cleanDescription,
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
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { genre } = req.query;
  let sql = 'SELECT * FROM movies WHERE user_id = ?';
  const params = [req.user.id];

  if (genre !== undefined) {
    if (typeof genre !== 'string') {
      return res.status(400).json({ error: 'Genre must be a text value.' });
    }
    const trimmedGenre = genre.trim();
    if (trimmedGenre !== '') {
      sql += ' AND genre = ?';
      params.push(trimmedGenre);
    }
  }

  sql += ' ORDER BY id DESC';

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
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const movieId = Number(req.params.id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ error: 'Invalid movie ID.' });
  }

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
          return res.status(400).json({ error: `Release year must be a valid integer between 1888 and ${maxYear}.` });
        }
        updatedYear = yearNum;
      }
    }

    const cleanOptionalField = (val, currentVal, label) => {
      if (val === undefined) return currentVal;
      if (val === null) return null;
      if (typeof val !== 'string') return Symbol('invalid');
      const trimmed = val.trim();
      return { value: trimmed === '' ? null : trimmed, label };
    };

    const dirCheck = cleanOptionalField(director, movie.director, 'Director');
    const genreCheck = cleanOptionalField(genre, movie.genre, 'Genre');
    const descCheck = cleanOptionalField(description, movie.description, 'Description');

    for (const check of [dirCheck, genreCheck, descCheck]) {
      if (typeof check === 'symbol') {
        return res.status(400).json({ error: 'Optional fields must be text or null.' });
      }
    }

    const updatedDirector = typeof dirCheck === 'object' ? dirCheck.value : dirCheck;
    const updatedGenre = typeof genreCheck === 'object' ? genreCheck.value : genreCheck;
    const updatedDescription = typeof descCheck === 'object' ? descCheck.value : descCheck;

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
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
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
    if (movie.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You do not own this movie.' });
    }

    db.run('DELETE FROM movies WHERE id = ? AND user_id = ?', [movieId, req.user.id], function (err) {
      if (err) {
        console.error(err);
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

  const ratingNumber = Number(req.body.rating);
  const rawComment = req.body.comment;

  if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  if (rawComment !== undefined && rawComment !== null && typeof rawComment !== 'string') {
    return res.status(400).json({ error: 'Comment must be a string.' });
  }

  const cleanedComment =
    typeof rawComment === 'string'
      ? rawComment.trim().replace(/[<>]/g, '')
      : '';
  const sanitizedComment = cleanedComment.length > 0 ? cleanedComment : null;

  if (sanitizedComment && sanitizedComment.length > 1000) {
    return res.status(400).json({ error: 'Comment must be 1000 characters or fewer.' });
  }

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