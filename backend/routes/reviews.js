const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('./auth');

router.use(requireAuth);

// Update own review: PATCH /api/reviews/:id
router.patch('/:id', (req, res) => {
  // 1. Authentication check
  if (!req.user?.id) {
    return res.status(401).json({
      error: 'Unauthorized.'
    });
  }

  // 2. Validate review ID
  const reviewId = Number(req.params.id);

  if (!Number.isSafeInteger(reviewId) || reviewId <= 0) {
    return res.status(400).json({
      error: 'Invalid review ID.'
    });
  }

  // 3. Get request data
  const { rating, comment } = req.body || {};

  // At least one field must be provided
  if (rating === undefined && comment === undefined) {
    return res.status(400).json({
      error: 'Provide a rating or comment to update.'
    });
  }

  // 4. Validate rating
  if (
    rating !== undefined &&
    (!Number.isInteger(rating) || rating < 1 || rating > 5)
  ) {
    return res.status(400).json({
      error: 'Rating must be an integer between 1 and 5.'
    });
  }

  // 5. Validate comment
  if (
    comment !== undefined &&
    comment !== null &&
    typeof comment !== 'string'
  ) {
    return res.status(400).json({
      error: 'Comment must be a string.'
    });
  }

  if (typeof comment === 'string' && comment.length > 1000) {
    return res.status(400).json({
      error: 'Comment must be 1000 characters or fewer.'
    });
  }

  // 6. Find the existing review
  db.get(
    'SELECT * FROM reviews WHERE id = ?',
    [reviewId],
    (err, review) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          error: 'Internal server error.'
        });
      }

      if (!review) {
        return res.status(404).json({
          error: 'Review not found.'
        });
      }

      // 7. Ownership check
      if (review.user_id !== req.user.id) {
        return res.status(403).json({
          error: 'You can only edit your own review.'
        });
      }

      // 8. Prepare updated values
      const updatedRating =
        rating === undefined ? review.rating : rating;

      let updatedComment = review.comment;

      if (comment !== undefined) {
        updatedComment =
          typeof comment === 'string'
            ? comment.trim().replace(/[<>]/g, '') || null
            : null;
      }

      // 9. Update only if the user still owns the review
      // and the movie is marked as watched
      const updateSql = `
        UPDATE reviews
        SET rating = ?, comment = ?
        WHERE id = ?
          AND user_id = ?
          AND EXISTS (
            SELECT 1 FROM user_movies
            WHERE user_movies.user_id = reviews.user_id
              AND user_movies.movie_id = reviews.movie_id
              AND user_movies.status = 'watched'
          )
      `;

      db.run(
        updateSql,
        [
          updatedRating,
          updatedComment,
          reviewId,
          req.user.id
        ],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({
              error: 'Internal server error.'
            });
          }

          if (this.changes === 0) {
            return res.status(403).json({
              error: 'The review is no longer available for editing.'
            });
          }

          // 10. Return the updated review
          db.get(
            'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
            [reviewId, req.user.id],
            (err, updatedReview) => {
              if (err) {
                console.error(err);
                return res.status(500).json({
                  error: 'Internal server error.'
                });
              }

              if (!updatedReview) {
                return res.status(404).json({
                  error: 'Review not found.'
                });
              }

              return res.status(200).json({
                message: 'Review updated successfully.',
                review: updatedReview
              });
            }
          );
        }
      );
    }
  );
});

// Delete own review: DELETE /api/reviews/:id
router.delete('/:id', (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const reviewId = Number(req.params.id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return res.status(400).json({ error: 'Invalid review ID.' });
  }

  db.get('SELECT * FROM reviews WHERE id = ?', [reviewId], (err, review) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    if (review.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You can only delete your own review.' });
    }

    db.run(
      'DELETE FROM reviews WHERE id = ? AND user_id = ?',
      [reviewId, req.user.id],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Review not found.' });
        }
        return res.status(200).json({ message: 'Review deleted successfully.' });
      }
    );
  });
});

module.exports = router;