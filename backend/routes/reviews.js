const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('./auth');

router.use(requireAuth);

// Delete own review: DELETE /api/reviews/:id
router.delete('/:id', (req, res) => {
  const reviewId = req.params.id;

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

    db.run('DELETE FROM reviews WHERE id = ? AND user_id = ?', [reviewId, req.user.id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      return res.status(200).json({ message: 'Review deleted successfully.' });
    });
  });
});

module.exports = router;