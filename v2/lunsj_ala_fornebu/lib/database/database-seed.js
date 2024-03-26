const sqlite3 = require("sqlite3");

// Get the username and password from command-line arguments
const username = process.argv[2]
const password = process.argv[3]

if (!username || !password) {
  console.error('Please provide a username and password.')
  process.exit(1)
}

// Connecting to or creating a new SQLite database file
const db = new sqlite3.Database(
  "./database.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the SQlite database.");
  }
);

// Serialize method ensures that database queries are executed sequentially
db.serialize(() => {
  // Create the Users table if it doesn't exist
  const createUserTableQuery =     
    `CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      isAdmin BOOLEAN NOT NULL DEFAULT 0
    )`;

  db.run(createUserTableQuery, (err) => {
      if (err) {
        return console.error(
          "Error creating database", err.message);
      }

      console.log("Created Users table.");
    }
  );


  // Insert an admin user
  const insertAdminUserQuery = 
    `INSERT INTO Users(username, password, isAdmin) VALUES(?, ?, 1)`

  db.run(insertAdminUserQuery, [username, password], function(err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Admin user inserted, ID ${this.lastID}`);
  });

  // Close the database connection after all operations are done
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Closed the database connection.");
  });
});
