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

const DATA_FILE = "usersData.json";
const BACKUP_FILE = "usersData_backup.json";

let usersData = {};

// Загружаем данные из файла при старте сервера
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            usersData = JSON.parse(fs.readFileSync(DATA_FILE));
        } catch (error) {
            console.error("Ошибка чтения JSON, восстанавливаем из резервной копии", error);
            if (fs.existsSync(BACKUP_FILE)) {
                usersData = JSON.parse(fs.readFileSync(BACKUP_FILE));
                fs.writeFileSync(DATA_FILE, JSON.stringify(usersData));
            } else {
                usersData = {};
            }
        }
    } else {
        usersData = {};
    }
}

// Функция для сохранения данных в файл
function saveData() {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(usersData, null, 2)); // Создаем резервную копию
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData, null, 2));
}

loadData(); // Загружаем данные при старте

// 📌 API: Получение списка хаков пользователя
app.get("/api/user/:userId/hacks", (req, res) => {
    const userId = req.params.userId;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
        saveData();
    }

    res.json({ hacks: usersData[userId].hacks });
});

// 📌 API: Добавление нового хака (сохранение в файл)
app.post("/api/user/:userId/hacks", (req, res) => {
    const { userId } = req.params;
    const { text, deadline } = req.body;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
    }

    usersData[userId].hacks.push({ text, deadline, frozen: false });
    saveData(); // Сохраняем изменения

    res.json({ success: true, hacks: usersData[userId].hacks });
});

// 📌 API: Удаление хака (сохранение в файл)
app.delete("/api/user/:userId/hacks/:index/delete", (req, res) => {
    const { userId, index } = req.params;
    if (!usersData[userId]) return res.status(404).json({ error: "Пользователь не найден" });

    usersData[userId].hacks.splice(index, 1);
    saveData(); // Сохраняем изменения

    res.json({ success: true });
});

// 📌 Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});