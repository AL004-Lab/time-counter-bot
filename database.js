const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

// Создание таблицы пользователей
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        userId TEXT UNIQUE,
        username TEXT,
        balance INTEGER DEFAULT 0
    );
`);

// Создание таблицы хаков
db.exec(`
    CREATE TABLE IF NOT EXISTS hacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        text TEXT,
        deadline INTEGER,
        frozen INTEGER DEFAULT 0,
        FOREIGN KEY(userId) REFERENCES users(userId)
    );
`);

module.exports = db;
