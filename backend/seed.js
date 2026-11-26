require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const dbFile = process.env.DB_FILE || 'database.sqlite';

// Development seed only
if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed is not allowed in production.');
}

const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE
);

// Promise helpers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);

      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

// ==========================================
// 1. Test Users
// ==========================================

const users = [
  {
    username: 'admin1',
    email: 'admin1@example.com',
    role: 'admin'
  },
  {
    username: 'admin2',
    email: 'admin2@example.com',
    role: 'admin'
  },
  {
    username: 'demo1',
    email: 'demo1@example.com',
    role: 'user'
  },
  {
    username: 'demo2',
    email: 'demo2@example.com',
    role: 'user'
  }
];

// Development password only
const demoPassword = 'MovieDexDemo2026!';

// ==========================================
// 2. Movie Catalog
// ==========================================

const movies = [
  {
    title: 'Interstellar',
    director: 'Christopher Nolan',
    release_year: 2014,
    genre: 'Sci-Fi / Adventure / Drama',
    description:
      'A former pilot travels through a wormhole to find a new home for humanity.',
    poster_url: '/posters/interstellar.JPG'
  },
  {
    title: 'Dune',
    director: 'Denis Villeneuve',
    release_year: 2021,
    genre: 'Sci-Fi / Adventure / Drama',
    description:
      'Paul Atreides travels to Arrakis and becomes involved in a conflict over a valuable resource.',
    poster_url: '/posters/Dune.JPG'
  },
  {
    title: 'Spider-Man: No Way Home',
    director: 'Jon Watts',
    release_year: 2021,
    genre: 'Action / Adventure / Fantasy',
    description:
      'Peter Parker seeks help from Doctor Strange, but a spell brings dangerous visitors from other universes.',
    poster_url: '/posters/Spider-Man.JPG'
  },
  {
    title: 'Barbie',
    director: 'Greta Gerwig',
    release_year: 2023,
    genre: 'Comedy / Adventure / Fantasy',
    description:
      'Barbie travels to the real world and begins to question her identity and purpose.',
    poster_url: '/posters/Barbie.JPG'
  },
  {
    title: 'The Batman',
    director: 'Matt Reeves',
    release_year: 2022,
    genre: 'Action / Crime / Drama',
    description:
      'Batman investigates a series of crimes and uncovers corruption in Gotham City.',
    poster_url: '/posters/The Batman.JPG'
  },
  {
    title: 'Arrival',
    director: 'Denis Villeneuve',
    release_year: 2016,
    genre: 'Sci-Fi / Drama / Mystery',
    description:
      'A linguist attempts to communicate with mysterious alien visitors.',
    poster_url: '/posters/Arrival.JPG'
  },
  {
    title: 'Inception',
    director: 'Christopher Nolan',
    release_year: 2010,
    genre: 'Sci-Fi / Action / Thriller',
    description:
      "A skilled thief enters dreams to plant an idea inside another person's mind.",
    poster_url: '/posters/Inception.JPG'
  },
  {
    title: 'Blade Runner',
    director: 'Ridley Scott',
    release_year: 1982,
    genre: 'Sci-Fi / Thriller / Drama',
    description:
      'A former police officer tracks down artificial humans in a futuristic Los Angeles.',
    poster_url: '/posters/Blade Runner.JPG'
  },
  {
    title: 'Oppenheimer',
    director: 'Christopher Nolan',
    release_year: 2023,
    genre: 'Drama / History / Biography',
    description:
      'A physicist faces the scientific and moral consequences of developing the atomic bomb.',
    poster_url: '/posters/Oppenheimer.JPG'
  },
  {
    title: 'La La Land',
    director: 'Damien Chazelle',
    release_year: 2016,
    genre: 'Romance / Drama / Musical',
    description:
      'An aspiring actress and a jazz musician pursue their dreams in Los Angeles.',
    poster_url: '/posters/LaLaLand.JPG'
  },
  {
    title: 'Titanic',
    director: 'James Cameron',
    release_year: 1997,
    genre: 'Romance / Drama',
    description:
      'Two passengers from different social classes fall in love aboard the Titanic.',
    poster_url: '/posters/Titanic.JPG'
  },
  {
    title: 'Parasite',
    director: 'Bong Joon-ho',
    release_year: 2019,
    genre: 'Thriller / Drama',
    description:
      'Two families from different economic backgrounds become unexpectedly connected.',
    poster_url: '/posters/Parasite.JPG'
  },
  {
    title: 'The Dark Knight',
    director: 'Christopher Nolan',
    release_year: 2008,
    genre: 'Action / Crime / Thriller',
    description:
      'Batman faces a criminal mastermind who threatens the stability of Gotham City.',
    poster_url: '/posters/The Dark Knight.JPG'
  },
  {
    title: 'Coco',
    director: 'Lee Unkrich',
    release_year: 2017,
    genre: 'Animation / Adventure / Family',
    description:
      'A young musician discovers the importance of family in the Land of the Dead.',
    poster_url: '/posters/Coco.JPG'
  },
  {
    title: 'Inside Out',
    director: 'Pete Docter',
    release_year: 2015,
    genre: 'Animation / Comedy / Family',
    description:
      'A young girl learns to understand her emotions while adapting to a new life.',
    poster_url: '/posters/Inside Out.JPG'
  },
  {
    title: 'Whiplash',
    director: 'Damien Chazelle',
    release_year: 2014,
    genre: 'Drama / Music',
    description:
      'A talented drummer struggles under the pressure of a demanding music instructor.',
    poster_url: '/posters/Whiplash.JPG'
  },
  {
    title: 'Get Out',
    director: 'Jordan Peele',
    release_year: 2017,
    genre: 'Horror / Thriller / Mystery',
    description:
      'A young man discovers disturbing secrets while visiting his girlfriend’s family.',
    poster_url: '/posters/Get Out.JPG'
  },
  {
    title: 'The Grand Budapest Hotel',
    director: 'Wes Anderson',
    release_year: 2014,
    genre: 'Comedy / Adventure / Drama',
    description:
      'A hotel concierge and his young assistant become involved in an unexpected adventure.',
    poster_url: '/posters/The Grand Budapest Hotel.JPG'
  },
  {
    title: 'The Truman Show',
    director: 'Peter Weir',
    release_year: 1998,
    genre: 'Comedy / Drama / Sci-Fi',
    description:
      'A man gradually discovers that his entire life is part of a television show.',
    poster_url: '/posters/The Truman Show.JPG'
  },
  {
    title: 'The Shawshank Redemption',
    director: 'Frank Darabont',
    release_year: 1994,
    genre: 'Drama / Crime',
    description:
      'Two prisoners develop a friendship while holding on to hope and freedom.',
    poster_url: '/posters/The Shawshank Redemption.JPG'
  }
];

// ==========================================
// 3. Seed Execution
// ==========================================

async function seed() {
  let transactionStarted = false;

  try {
    console.log('Starting MovieDex seed...');

    await run('PRAGMA foreign_keys = ON');
    await run('BEGIN IMMEDIATE');

    transactionStarted = true;

    const userIds = {};
    const movieIds = {};

    // Create test users
    for (const user of users) {
      let existing = await get(
        'SELECT id, username, role FROM users WHERE email = ?',
        [user.email]
      );

      if (!existing) {
        const hashedPassword = await bcrypt.hash(
          demoPassword,
          10
        );

        const result = await run(
          `INSERT INTO users
           (username, email, password, role)
           VALUES (?, ?, ?, ?)`,
          [
            user.username,
            user.email,
            hashedPassword,
            user.role
          ]
        );

        userIds[user.username] = result.lastID;

        console.log(`Created user: ${user.username}`);
      } else {
        if (
          existing.role !== user.role ||
          existing.username !== user.username
        ) {
          throw new Error(
            `Seed account conflict: ${user.email}`
          );
        }

        userIds[user.username] = existing.id;

        console.log(`Skipped existing user: ${user.username}`);
      }
    }

    // Create movie catalog
    for (const movie of movies) {
      const existing = await get(
        `SELECT id FROM movies
         WHERE title = ? AND release_year = ?`,
        [movie.title, movie.release_year]
      );

      if (existing) {
        movieIds[movie.title] = existing.id;

        // Fill missing poster URLs without overwriting existing posters
        if (movie.poster_url) {
          await run(
            `UPDATE movies
             SET poster_url = ?
             WHERE id = ?
             AND (poster_url IS NULL OR poster_url = '')`,
            [movie.poster_url, existing.id]
          );
        }

        console.log(`Checked existing movie: ${movie.title}`);
        continue;
      }

      const result = await run(
        `INSERT INTO movies
         (
           title,
           director,
           release_year,
           genre,
           description,
           poster_url,
           user_id
         )
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          movie.title,
          movie.director,
          movie.release_year,
          movie.genre,
          movie.description,
          movie.poster_url,
          userIds.admin1
        ]
      );

      movieIds[movie.title] = result.lastID;

      console.log(`Created movie: ${movie.title}`);
    }

    // ========================================
    // 4. Sample Watchlist & Collection
    // ========================================

    const entries = [
      ['demo1', 'Interstellar', 'watched'],
      ['demo1', 'Dune', 'watchlist'],
      ['demo1', 'Barbie', 'watched'],
      ['demo1', 'Inception', 'watchlist'],

      ['demo2', 'Arrival', 'watched'],
      ['demo2', 'The Batman', 'watchlist'],
      ['demo2', 'Parasite', 'watched'],
      ['demo2', 'Titanic', 'watchlist']
    ];

    for (const [username, title, status] of entries) {
      await run(
        `INSERT INTO user_movies
         (user_id, movie_id, status)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, movie_id) DO NOTHING`,
        [
          userIds[username],
          movieIds[title],
          status
        ]
      );
    }

    // ========================================
    // 5. Sample Reviews
    // ========================================

    const reviews = [
      ['demo1', 'Interstellar', 5,
        'Amazing story and beautiful soundtrack.'],

      ['demo1', 'Barbie', 4,
        'Creative, funny, and meaningful.'],

      ['demo2', 'Arrival', 5,
        'A thoughtful and emotional science fiction movie.'],

      ['demo2', 'Parasite', 5,
        'Excellent storytelling and social commentary.']
    ];

    for (const [username, title, rating, comment] of reviews) {
      const userId = userIds[username];
      const movieId = movieIds[title];

      const existing = await get(
        `SELECT id FROM reviews
         WHERE user_id = ? AND movie_id = ?`,
        [userId, movieId]
      );

      const watched = await get(
        `SELECT id FROM user_movies
         WHERE user_id = ?
         AND movie_id = ?
         AND status = 'watched'`,
        [userId, movieId]
      );

      if (!existing && watched) {
        await run(
          `INSERT INTO reviews
           (user_id, movie_id, rating, comment)
           VALUES (?, ?, ?, ?)`,
          [userId, movieId, rating, comment]
        );
      }
    }

    await run('COMMIT');
    transactionStarted = false;

    console.log('\n================================');
    console.log('MovieDex seed completed!');
    console.log('================================');

  } catch (error) {
    if (transactionStarted) {
      await run('ROLLBACK').catch(console.error);
    }

    console.error('Seed failed:', error.message);
    process.exitCode = 1;

  } finally {
    db.close((err) => {
      if (err) {
        console.error(err.message);
        process.exitCode = 1;
      }
    });
  }
}

seed();