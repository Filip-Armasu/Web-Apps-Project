require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();

const dbFile = process.env.DB_FILE || 'database.sqlite';

const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      console.error('Database connection failed:', err.message);
      process.exitCode = 1;
      return;
    }

    migrate();
  }
);

// Close database connection
function finish(error) {
  if (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  }

  db.close((err) => {
    if (err) {
      console.error('Database close failed:', err.message);
      process.exitCode = 1;
    }
  });
}

// STEP 1: Add poster_url column
function migrate() {
  console.log('Starting database migration...');

  db.all('PRAGMA table_info(movies)', (err, columns) => {
    if (err) return finish(err);

    if (columns.length === 0) {
      return finish(
        new Error('Movies table does not exist.')
      );
    }

    const hasPosterUrl = columns.some(
      (column) => column.name === 'poster_url'
    );

    if (hasPosterUrl) {
      console.log('poster_url column already exists.');
      return migrateReviews();
    }

    db.run(
      'ALTER TABLE movies ADD COLUMN poster_url TEXT',
      (err) => {
        if (err) return finish(err);

        console.log('poster_url column added successfully.');

        migrateReviews();
      }
    );
  });
}

// STEP 2: Prevent duplicate reviews
function migrateReviews() {
  const duplicateSql = `
    SELECT user_id, movie_id, COUNT(*) AS count
    FROM reviews
    GROUP BY user_id, movie_id
    HAVING COUNT(*) > 1
  `;

  db.all(duplicateSql, (err, duplicates) => {
    if (err) return finish(err);

    if (duplicates.length > 0) {
      console.error('Duplicate reviews found:', duplicates);

      return finish(
        new Error(
          'Resolve duplicate reviews before creating the unique index.'
        )
      );
    }

    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_movie
      ON reviews(user_id, movie_id)
    `, (err) => {
      if (err) return finish(err);

      console.log('Unique review index is ready.');
      console.log('Migration completed successfully!');

      finish();
    });
  });
}