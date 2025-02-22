require("dotenv").config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            points INTEGER DEFAULT 0,
            endTime INTEGER
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS hacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            text TEXT,
            deadline INTEGER
        )`);
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(row || { id: userId, points: 0, endTime: null });
        }
    });
});

app.post('/api/user/:id/setup', (req, res) => {
    const { endTime } = req.body;
    const userId = req.params.id;

    db.run(
        'INSERT INTO users (id, endTime) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET endTime = excluded.endTime',
        [userId, endTime],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ success: true });
            }
        }
    );
});

app.post('/api/user/:id/add-points', (req, res) => {
    const userId = req.params.id;
    db.run(
        'UPDATE users SET points = points + 1 WHERE id = ?',
        [userId],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                db.get('SELECT points FROM users WHERE id = ?', [userId], (err, row) => {
                    res.json({ points: row?.points || 0 });
                });
            }
        }
    );
});

app.get('/api/user/:id/hacks', (req, res) => {
    const userId = req.params.id;
    db.all('SELECT * FROM hacks WHERE userId = ?', [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ hacks: rows });
        }
    });
});

app.post('/api/user/:id/hacks', (req, res) => {
    const { text, deadline } = req.body;
    const userId = req.params.id;

    db.run(
        'INSERT INTO hacks (userId, text, deadline) VALUES (?, ?, ?)',
        [userId, text, deadline],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ success: true });
            }
        }
    );
});

app.delete('/api/user/:id/hacks/:hackId/delete', (req, res) => {
    const userId = req.params.id;
    const hackId = req.params.hackId;

    db.run('DELETE FROM hacks WHERE id = ? AND userId = ?', [hackId, userId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));