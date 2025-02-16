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

// 📌 API: Получение списка хаков пользователя
app.get("/api/user/:userId/hacks", (req, res) => {
    const userId = req.params.userId;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
        saveData();
    }

    res.json({ hacks: usersData[userId].hacks });
});

// 📌 API: Добавление нового хака (теперь с сохранением в файл)
app.post("/api/user/:userId/hacks", (req, res) => {
    const { userId } = req.params;
    const { text, deadline } = req.body;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: null, points: 0, hacks: [] };
    }

    usersData[userId].hacks.push({ text, deadline, frozen: false });
    saveData();  // Теперь хаки сохраняются в usersData.json

    res.json({ success: true, hacks: usersData[userId].hacks });
});

// 📌 API: Удаление хака (теперь с сохранением в файл)
app.delete("/api/user/:userId/hacks/:index/delete", (req, res) => {
    const { userId, index } = req.params;
    if (!usersData[userId]) return res.status(404).json({ error: "Пользователь не найден" });

    usersData[userId].hacks.splice(index, 1);
    saveData();  // Теперь удаление хака сохраняется в usersData.json

    res.json({ success: true });
});

// 📌 Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});