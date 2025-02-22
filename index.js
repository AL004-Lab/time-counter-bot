require("dotenv").config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к базе данных SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Ошибка подключения к SQLite:", err.message);
    } else {
        console.log("✅ Подключено к базе данных SQLite.");
    }
});

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Создание таблиц, если их нет
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        endTime INTEGER,
        points INTEGER DEFAULT 0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS hacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        text TEXT,
        deadline INTEGER,
        frozen INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users(userId)
    )`);
});

// 📌 Получение данных пользователя
app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params;
    db.get("SELECT * FROM users WHERE userId = ?", [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
            db.run("INSERT INTO users (userId, endTime, points) VALUES (?, NULL, 0)", [userId], () => {
                res.json({ userId, endTime: null, points: 0, hacks: [] });
            });
        } else {
            db.all("SELECT * FROM hacks WHERE userId = ?", [userId], (err, hacks) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ userId, endTime: row.endTime, points: row.points, hacks });
            });
        }
    });
});

// 📌 Настройка пользователя
app.post('/api/user/:userId/setup', (req, res) => {
    const { userId } = req.params;
    const { endTime } = req.body;
    db.run("INSERT INTO users (userId, endTime, points) VALUES (?, ?, 0) ON CONFLICT(userId) DO UPDATE SET endTime = ?", 
        [userId, endTime, endTime], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
    });
});

// 📌 Начисление баллов
app.post('/api/user/:userId/add-points', (req, res) => {
    const { userId } = req.params;
    db.run("UPDATE users SET points = points + 1 WHERE userId = ?", [userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get("SELECT points FROM users WHERE userId = ?", [userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, points: row.points });
        });
    });
});

// 📌 Получение списка хаков
app.get('/api/user/:userId/hacks', (req, res) => {
    const { userId } = req.params;
    db.all("SELECT * FROM hacks WHERE userId = ?", [userId], (err, hacks) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ hacks });
    });
});

// 📌 Добавление хака
app.post('/api/user/:userId/hacks', (req, res) => {
    const { userId } = req.params;
    const { text, deadline } = req.body;
    db.run("INSERT INTO hacks (userId, text, deadline, frozen) VALUES (?, ?, ?, 0)", 
        [userId, text, deadline], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
    });
});

// 📌 Удаление хака
app.delete('/api/user/:userId/hacks/:id', (req, res) => {
    const { userId, id } = req.params;
    db.run("DELETE FROM hacks WHERE id = ? AND userId = ?", [id, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});