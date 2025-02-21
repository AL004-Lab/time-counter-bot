require("dotenv").config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const usersFile = path.join(__dirname, 'usersData.json');

app.use(express.json());
app.use(express.static('public'));

// Функция загрузки данных пользователей
function loadUsers() {
    if (!fs.existsSync(usersFile)) {
        fs.writeFileSync(usersFile, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(usersFile));
}

// Функция сохранения данных пользователей
function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Получение данных пользователя
app.get('/api/user/:userId', (req, res) => {
    const users = loadUsers();
    const userId = req.params.userId;

    if (!users[userId]) {
        users[userId] = { endTime: null, points: 0, hacks: [] };
        saveUsers(users);
    }

    res.json(users[userId]);
});

// Настройка пользователя (добавление времени)
app.post('/api/user/:userId/setup', (req, res) => {
    const users = loadUsers();
    const { userId } = req.params;
    const { endTime } = req.body;

    if (!users[userId]) {
        users[userId] = { endTime: null, points: 0, hacks: [] };
    }

    users[userId].endTime = endTime;
    saveUsers(users);
    res.json({ success: true });
});

// Добавление хаков
app.post('/api/user/:userId/hacks', (req, res) => {
    const users = loadUsers();
    const { userId } = req.params;
    const { text, deadline } = req.body;

    if (!users[userId]) {
        users[userId] = { endTime: null, points: 0, hacks: [] };
    }

    users[userId].hacks.push({ text, deadline, frozen: false });
    saveUsers(users);
    res.json({ success: true, hacks: users[userId].hacks });
});

// Получение хаков пользователя
app.get('/api/user/:userId/hacks', (req, res) => {
    const users = loadUsers();
    const { userId } = req.params;

    res.json({ hacks: users[userId]?.hacks || [] });
});

// Удаление хака
app.delete('/api/user/:userId/hacks/:index', (req, res) => {
    const users = loadUsers();
    const { userId, index } = req.params;

    if (users[userId] && users[userId].hacks[index]) {
        users[userId].hacks.splice(index, 1);
        saveUsers(users);
    }

    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});