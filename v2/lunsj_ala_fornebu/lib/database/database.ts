import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { User } from '../definitions';
import path from 'path';

// Open SQLite database connection
export async function openDb() {
  const dbPath = path.resolve(process.cwd(), './lib/database/database.db');

  console.log("openDb: ", dbPath);

  const connection = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });  

  return connection;
}

export async function getUser(username: string, password: string) {
  const database = await openDb();

  console.log("getUser: ", { username, password });

  const res = database.get<User>(
    `SELECT * FROM Users WHERE Username = ? AND Password = ?`,
    [username, password]);

  return res;
}
