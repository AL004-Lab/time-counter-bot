require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

let usersData = {};
const DATA_FILE = "usersData.json";

// Загружаем данные из файла при старте сервера
if (fs.existsSync(DATA_FILE)) {
    usersData = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData));
}

// Функция для сохранения данных в файл
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData, null, 2));
}

// 📌 API: Получение данных пользователя
app.get("/api/user/:userId", (req, res) => {
    const userId = req.params.userId;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
        saveData();
    }

    res.json(usersData[userId]);
});

// 📌 API: Установка таймера пользователя
app.post("/api/user/:userId/setup", (req, res) => {
    const { userId } = req.params;
    const { endTime } = req.body;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
    }

    usersData[userId].endTime = endTime;
    saveData();
    res.json({ success: true, endTime });
});

// 📌 API: Добавление баллов
app.post("/api/user/:userId/add-points", (req, res) => {
    const { userId } = req.params;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
    }

    usersData[userId].points += 1;
    saveData();
    res.json({ success: true, points: usersData[userId].points });
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

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
    }

    usersData[userId].hacks.push({ text, deadline, frozen: false });
    saveData();
    res.json({ success: true, hacks: usersData[userId].hacks });
});

// 📌 API: Удаление хака
app.delete("/api/user/:userId/hacks/:index/delete", (req, res) => {
    const { userId, index } = req.params;
    if (!usersData[userId]) return res.status(404).json({ error: "Пользователь не найден" });

    usersData[userId].hacks.splice(index, 1);
    saveData();
    res.json({ success: true });
});

// 📌 API: Заморозка/разморозка хака
app.post("/api/user/:userId/hacks/:index/toggle-freeze", (req, res) => {
    const { userId, index } = req.params;
    if (!usersData[userId] || !usersData[userId].hacks[index]) {
        return res.status(404).json({ error: "Хак не найден" });
    }

    usersData[userId].hacks[index].frozen = !usersData[userId].hacks[index].frozen;
    saveData();
    res.json({ success: true, frozen: usersData[userId].hacks[index].frozen });
});

// 📌 Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
