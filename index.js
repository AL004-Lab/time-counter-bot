const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const db = require('./database'); // Подключение базы данных SQLite

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const usersDataPath = path.join(__dirname, 'usersData.json');

// Функция загрузки данных пользователей
function loadUsersData() {
    if (!fs.existsSync(usersDataPath)) {
        fs.writeFileSync(usersDataPath, JSON.stringify({ users: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
}

// Функция сохранения данных пользователей
function saveUsersData(data) {
    fs.writeFileSync(usersDataPath, JSON.stringify(data, null, 2));
}

// Получение данных пользователя
app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params;
    const data = loadUsersData();
    const user = data.users[userId] || { endTime: null, points: 0, hacks: [] };
    res.json(user);
});

// Установка времени жизни пользователя
app.post('/api/user/:userId/setup', (req, res) => {
    const { userId } = req.params;
    const { endTime } = req.body;
    const data = loadUsersData();

    if (!data.users[userId]) {
        data.users[userId] = { endTime: null, points: 0, hacks: [] };
    }
    
    data.users[userId].endTime = endTime;
    saveUsersData(data);

    res.json({ success: true, endTime });
});

// Начисление баланса
app.post('/api/user/:userId/add-points', (req, res) => {
    const { userId } = req.params;
    const data = loadUsersData();

    if (!data.users[userId]) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }

    data.users[userId].points += 1;
    saveUsersData(data);

    res.json({ success: true, points: data.users[userId].points });
});

// Получение списка хаков пользователя
app.get('/api/user/:userId/hacks', (req, res) => {
    const { userId } = req.params;
    const data = loadUsersData();

    if (!data.users[userId]) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({ hacks: data.users[userId].hacks || [] });
});

// Добавление хака
app.post('/api/user/:userId/hacks', (req, res) => {
    const { userId } = req.params;
    const { text, deadline } = req.body;
    const data = loadUsersData();

    if (!data.users[userId]) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }

    data.users[userId].hacks.push({ text, deadline });
    saveUsersData(data);

    res.json({ success: true, hacks: data.users[userId].hacks });
});

// Удаление хака
app.delete('/api/user/:userId/hacks/:index/delete', (req, res) => {
    const { userId, index } = req.params;
    const data = loadUsersData();

    if (!data.users[userId] || !data.users[userId].hacks[index]) {
        return res.status(404).json({ error: "Хак не найден" });
    }

    data.users[userId].hacks.splice(index, 1);
    saveUsersData(data);

    res.json({ success: true, hacks: data.users[userId].hacks });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});