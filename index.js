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

// **Перенаправляем `/` на `index.html`**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// **API для получения данных пользователя**
app.get("/api/user/:userId", (req, res) => {
    const userId = req.params.userId;

    if (!usersData[userId]) {
        usersData[userId] = { endTime: Date.now() + 365 * 24 * 60 * 60 * 1000, points: 0 };
        saveData();
    }

    res.json({
        endTime: usersData[userId].endTime || Date.now() + 365 * 24 * 60 * 60 * 1000,
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