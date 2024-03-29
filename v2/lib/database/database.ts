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

export async function saveCanteenMenu(menus: CanteenMenu[]) {
  try
  {
    const database = await openDb();
  
    for(let i = 0; i < menus.length; i++) {
      const menu = menus[i];

      if(menu.id <= 0) {
        await database.run(
          `INSERT INTO Menus (description, day, canteenId) VALUES (?, ?, ?)`,
          [menu.description, menu.day, menu.canteenId]);
      } else {
        await database.run(
          `UPDATE Menus SET description = ? where id = ?`,
          [menu.description, menu.id]);
      }
    }
  
    await database.close();
  } catch(err) {
    console.error('saveCanteenMenu: ', err);
  }  
}

export async function getCateenMenus(canteenId: number) {
  const database = await openDb();

  const menus = await database.all<CanteenMenu[]>(
    `SELECT * FROM Menus WHERE canteenId = ?`, [canteenId]);

  for(let i = 1; i <= 7; i++) {
    const day = menus.find(x => x.day == i);

    if(!day) {
      menus.push({
        day: i,
        description: '',
        allergens: '',
        canteenId: canteenId,
        id: 0
      });
    }
  }

  await database.close();

  return menus;
}

export async function getUser(username: string, password: string) {
  const database = await openDb();

  console.log("getUser: ", { username, password });

  const res = database.get<User>(
    `SELECT * FROM Users WHERE Username = ? AND Password = ?`,
    [username, password]);

  await database.close();

  return res;
}

export async function getUserByUsername(username: string) {
  const database = await openDb();

  const res = await database.get<User>(
    `SELECT * FROM Users WHERE Username = ?`,
    [username]);

  console.log('getUserByUsername: ', res);

  await database.close();

  return res;
}

export async function listUsers() {
  const database = await openDb();

  const res = await database.all<User[]>(
    `SELECT * FROM Users`);

  console.log('listUsers: ', res);

  await database.close();

  return res;
}

export async function createUser(username: string, password: string, isAdmin: boolean) {
  const database = await openDb();
  const res = await database.run(
    `INSERT INTO Users (username, password, isAdmin) VALUES (?, ?, ?)`,
    [username, password, isAdmin]);

  await database.close();

  return res;
}

export async function updateUser(user: User) {
  const database = await openDb();

  const res = database.run(
    `UPDATE Users SET username = ?, password = ?, isAdmin = ? WHERE id = ?`,
    [user.username, user.password, user.isAdmin, user.id]);

  await database.close();

  return res;
}

export async function createCanteen(name: string, adminUserId: number) {
  const database = await openDb();

  const res = database.run(
    `INSERT INTO Canteens (name, adminUserId) VALUES (?, ?)`,
    [name, adminUserId]);

  await database.close();

  return res;
}

export async function updateCanteen(id: number, name: string, adminUserId: number) {
  const database = await openDb();

  const res = database.run(
    `UPDATE Canteens SET name = ?, adminUserId = ? WHERE id = ?`,
    [name, adminUserId, id]);

  await database.close();

  return res;
}

export async function deleteCanteen(id: number) {
  const database = await openDb();

  const res = database.run(
    `DELETE FROM Canteens WHERE id = ?`,
    [id]);

  await database.close();

  return res;
}

export async function listCanteens() {
  const database = await openDb();

  const res = database.all<Canteen[]>(
    `SELECT * FROM Canteens`);

  await database.close();

  return res;
}

export async function listCanteenMenus() {
  const database = await openDb();

  const res = database.all<CanteenMenu[]>(
    `SELECT * FROM Menus`);

  await database.close();

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

export async function getCanteenByUser(username: string) {
  const database = await openDb();
  const query = `
    SELECT * FROM Canteens 
      JOIN Users ON Users.Id = Canteens.adminUserId
    WHERE Users.username = ?`;

  const canteen = await database
    .get<Canteen>(query, [username]);

  await database.close();

  return canteen;
}

