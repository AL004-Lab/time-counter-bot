require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = `/bot${process.env.BOT_TOKEN}`;
const WEBHOOK_URL = `${process.env.WEBAPP_URL}${WEBHOOK_PATH}`;

let usersData = {};
const DATA_FILE = "users.json";

// Загружаем данные пользователей
if (fs.existsSync(DATA_FILE)) {
    usersData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// Функция сохранения данных
const saveData = () => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData, null, 2));
};

// **Обслуживаем WebApp (статические файлы)**
app.use(express.static(path.join(__dirname, "public")));

// **Перенаправляем `/` на страницу настройки, если таймер не установлен**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "setup.html"));
});

// **API для сохранения даты рождения и установки таймера**
app.post("/api/user/:userId/setup", express.json(), (req, res) => {
    const userId = req.params.userId;
    const { birthDate } = req.body;

    if (!birthDate) {
        return res.status(400).json({ error: "Дата рождения обязательна" });
    }

    const birthYear = new Date(birthDate).getFullYear();
    const targetAge = 100;
    const endTime = new Date(birthYear + targetAge, 0, 1).getTime(); // 100 лет от даты рождения

    usersData[userId] = { birthDate, endTime, points: 0 };
    saveData();

    res.json({ success: true, endTime });
});

// **API для получения данных пользователя**
app.get("/api/user/:userId", (req, res) => {
    const userId = req.params.userId;

    if (!usersData[userId] || !usersData[userId].endTime) {
        return res.status(404).json({ error: "Пользователь не настроен" });
    }

    res.json({
        birthDate: usersData[userId].birthDate,
        endTime: usersData[userId].endTime,
        points: usersData[userId].points || 0,
    });
});

// **API для начисления баллов**
app.post("/api/user/:userId/add-points", express.json(), (req, res) => {
    const userId = req.params.userId;
    if (!usersData[userId]) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    usersData[userId].points += 5;
    saveData();
    res.json({ points: usersData[userId].points });
});

// **Запускаем сервер**
app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    await bot.telegram.setWebhook(WEBHOOK_URL);
    console.log("Webhook установлен! 🚀");
});