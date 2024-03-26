import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { Canteen, CanteenMenu, CanteenView, User } from '../definitions';
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

export async function createUser(username: string, password: string, isAdmin: boolean) {
  const database = await openDb();

  const res = database.run(
    `INSERT INTO Users (username, password, isAdmin) VALUES (?, ?, ?)`,
    [username, password, isAdmin]);

  return res;
}

export async function createCanteen(name: string, adminUserId: number) {
  const database = await openDb();

  const res = database.run(
    `INSERT INTO Canteens (name, adminUserId) VALUES (?, ?)`,
    [name, adminUserId]);

  return res;
}

export async function updateCanteen(id: number, name: string, adminUserId: number) {
  const database = await openDb();

  const res = database.run(
    `UPDATE Canteens SET name = ?, adminUserId = ? WHERE id = ?`,
    [name, adminUserId, id]);

  return res;
}

export async function deleteCanteen(id: number) {
  const database = await openDb();

  const res = database.run(
    `DELETE FROM Canteens WHERE id = ?`,
    [id]);

  return res;
}

export async function listCanteens() {
  const database = await openDb();

  const res = database.all<Canteen[]>(
    `SELECT * FROM Canteens`);

  return res;
}

export async function listCanteenMenus() {
  const database = await openDb();

  const res = database.all<CanteenMenu[]>(
    `SELECT * FROM Menus`);

  return res;
}

export async function listCanteenViews() {
  const canteens = await listCanteens();
  const allMenus = await listCanteenMenus();
  const canteenViews: CanteenView[] = [];

  canteens.forEach(canteen => {
    const menus = allMenus
      .filter(x => x.canteenId == canteen.id);

    const canteenView: CanteenView = {
      ...canteen,
      menus
    };

    canteenViews.push(canteenView);
  });

  return canteenViews;
}
