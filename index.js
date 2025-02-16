require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Обслуживание статики

let usersData = {};
const DATA_FILE = "usersData.json";

// Загружаем данные из файла при старте сервера
if (fs.existsSync(DATA_FILE)) {
    usersData = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData));
}

// Функция для сохранения данных
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData));
}

// 📌 Главная страница
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📌 API: Получение данных пользователя
app.get("/api/user/:userId", (req, res) => {
    const userId = req.params.userId;

    if (!usersData[userId]) {
        usersData[userId] = {
            endTime: null,
            points: 0,
            hacks: []
        };
        saveData();
    }

    res.json({
        endTime: usersData[userId].endTime,
        points: usersData[userId].points
    });
});

// 📌 API: Добавление очков пользователю
app.post("/api/user/:userId/add-points", (req, res) => {
    const userId = req.params.userId;
    if (!usersData[userId]) return res.status(404).json({ error: "User not found" });

    usersData[userId].points += 1;
    saveData();

    res.json({ points: usersData[userId].points });
});

// 📌 API: Установка таймера
app.post("/api/user/:userId/setup", (req, res) => {
    const userId = req.params.userId;
    const { endTime } = req.body;

    if (!usersData[userId]) {
        usersData[userId] = { points: 0, hacks: [] };
    }

    usersData[userId].endTime = endTime;
    saveData();
    res.json({ success: true });
});

// 📌 API: Сброс всех пользователей (обнуление данных)
app.post("/api/users/reset", (req, res) => {
    usersData = {};
    saveData();
    res.json({ success: true, message: "Все данные пользователей сброшены" });
});

// 📌 API: Получение списка хаков пользователя
app.get("/api/user/:userId/hacks", (req, res) => {
    const userId = req.params.userId;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
        saveData();
    }

    res.json({ hacks: usersData[userId].hacks });
});

// 📌 API: Добавление нового хака
app.post("/api/user/:userId/hacks", (req, res) => {
    const { userId } = req.params;
    const { text, deadline } = req.body;

    if (!usersData[userId]) return res.status(404).json({ error: "Пользователь не найден" });

    usersData[userId].hacks.push({ text, deadline, frozen: false });
    usersData[userId].hacks.sort((a, b) => a.deadline - b.deadline);
    saveData();

    res.json({ success: true, hacks: usersData[userId].hacks });
});

// 📌 API: Заморозка и разморозка хака
app.post("/api/user/:userId/hacks/:index/toggle", (req, res) => {
    const { userId, index } = req.params;
    if (!usersData[userId] || !usersData[userId].hacks[index]) return res.status(404).json({ error: "Хак не найден" });

    let hack = usersData[userId].hacks[index];
    hack.frozen = !hack.frozen;

    saveData();
    res.json({ success: true, frozen: hack.frozen });
});

// 📌 API: Удаление хака
app.delete("/api/user/:userId/hacks/:index/delete", (req, res) => {
    const { userId, index } = req.params;
    if (!usersData[userId]) return res.status(404).json({ error: "Пользователь не найден" });

    usersData[userId].hacks.splice(index, 1);
    saveData();

    res.json({ success: true });
});

// 📌 Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});