const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const db = require('../database'); 

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_key';

// User registration route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (existingUser) {
        return res.status(409).json({ error: 'Email is already registered.' });
      }

      const username = email.split('@')[0];
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      db.run(
        'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
        [email, username, hashedPassword],
        function (insertErr) {
          if (insertErr) {
            console.error(insertErr);
            return res.status(500).json({ error: 'Internal server error' });
          }

          return res.status(201).json({
            message: 'User registered successfully',
            user: { id: this.lastID, email, username }
          });
        }
      );
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// User login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: 'Logged in successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar ?? null,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});


// Middleware to verify JWT token
const requireAuth = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Get current user info
router.get('/me', requireAuth, (req, res) => {
  db.get(
    'SELECT id, username, email, role, avatar FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar ?? null,
        }
      });
    }
  );
});

// Logout: clear authentication cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res.status(200).json({
    message: 'Logged out successfully',
  });
});
module.exports = { router, requireAuth };

// Profile update route
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

router.patch('/profile', requireAuth, (req, res) => {
  const { username, email } = req.body;

  if (username === undefined && email === undefined) {
    return res.status(400).json({
      error: 'Provide at least one field to update (username or email).'
    });
  }

  db.get(
    'SELECT id, username, email, role, avatar FROM users WHERE id = ?',
    [req.user.id],
    (selectErr, currentUser) => {
      if (selectErr) {
        console.error(selectErr);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      let nextUsername = currentUser.username;
      if (username !== undefined) {
        if (typeof username !== 'string' || !username.trim()) {
          return res.status(400).json({ error: 'Username must be a non-empty string.' });
        }
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 2 || trimmedUsername.length > 50) {
          return res.status(400).json({
            error: 'Username must be between 2 and 50 characters.'
          });
        }
        nextUsername = trimmedUsername;
      }

      let nextEmail = currentUser.email;
      if (email !== undefined) {
        if (typeof email !== 'string' || !email.trim()) {
          return res.status(400).json({ error: 'Email must be a non-empty string.' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
          return res.status(400).json({ error: 'Please provide a valid email address.' });
        }
        nextEmail = normalizedEmail;
      }

      const updateSql = `
        UPDATE users
        SET username = ?, email = ?
        WHERE id = ?
      `;

      db.run(updateSql, [nextUsername, nextEmail, req.user.id], function (updateErr) {
        if (updateErr) {
          if (updateErr.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({
              error: 'That username or email is already in use.'
            });
          }
          console.error(updateErr);
          return res.status(500).json({ error: 'Internal server error' });
        }

        db.get(
          'SELECT id, username, email, role, avatar FROM users WHERE id = ?',
          [req.user.id],
          (finalErr, updatedUser) => {
            if (finalErr) {
              console.error(finalErr);
              return res.status(500).json({ error: 'Internal server error' });
            }

            return res.status(200).json({
              message: 'Profile updated successfully',
              user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar ?? null
              }
            });
          }
        );
      });
    }
  );
});

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });

const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype];
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mappedExt = ALLOWED_TYPES[file.mimetype];

  if (!mappedExt || (ext && ext !== mappedExt && !(mappedExt === '.jpg' && ext === '.jpeg'))) {
    const err = new Error('Only JPEG, PNG, and WebP images are allowed.');
    err.statusCode = 400;
    return cb(err, false);
  }

  return cb(null, true);
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

// Avatar upload route
router.post('/profile/avatar', requireAuth, (req, res) => {
  uploadAvatar.single('avatar')(req, res, (uploadErr) => {
    if (uploadErr) {
      if (uploadErr instanceof multer.MulterError) {
        if (uploadErr.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Avatar image must be 2 MB or smaller.' });
        }
        return res.status(400).json({ error: uploadErr.message });
      }
      return res.status(uploadErr.statusCode || 400).json({
        error: uploadErr.message || 'Invalid avatar upload.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an avatar image file.' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    db.run(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, req.user.id],
      function (dbErr) {
        if (dbErr) {
          console.error(dbErr);
          return res.status(500).json({ error: 'Internal server error' });
        }

        db.get(
          'SELECT id, username, email, role, avatar FROM users WHERE id = ?',
          [req.user.id],
          (selectErr, updatedUser) => {
            if (selectErr) {
              console.error(selectErr);
              return res.status(500).json({ error: 'Internal server error' });
            }

            return res.status(200).json({
              message: 'Avatar updated successfully',
              avatar: updatedUser.avatar,
              user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar ?? null,
              },
            });
          }
        );
      }
    );
  });
});