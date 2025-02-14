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

// **Функция расчёта оставшегося времени**
function getTimeLeft(endTime) {
    const now = new Date().getTime();
    const diff = endTime - now;

    if (diff <= 0) {
        return "⏳ Время истекло!";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days} д. ${hours} ч. ${minutes} м. ${seconds} с.`;
}

// **Обработчик команды /start**
bot.start((ctx) => {
    const userId = ctx.from.id;
    
    if (!usersData[userId]) {
        let endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        usersData[userId] = {
            username: ctx.from.username || `User${userId}`,
            endTime: endDate.getTime(),
            points: 0,
            lastCheckIn: null,
        };
        saveData();
    }

    ctx.reply(
        `Привет, ${ctx.from.first_name}! 🚀\n\n` +
        `Ты запустил таймер, осталось:\n\n⏳ *${getTimeLeft(usersData[userId].endTime)}* ⏳\n\n` +
        `Твой баланс: *${usersData[userId].points}* баллов.\n\n` +
        `Нажми кнопку, чтобы открыть WebApp и начать зарабатывать баллы!`,
        {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[
                    { text: "🚀 Открыть WebApp", web_app: { url: process.env.WEBAPP_URL } }
                ]]
            }
        }
    );
});

// **Команда /points — показывает баланс пользователя**
bot.command("points", (ctx) => {
    const userId = ctx.from.id;
    if (!usersData[userId]) {
        return ctx.reply("Ты ещё не запустил таймер! Используй /start.");
    }
    ctx.reply(`⭐ Твой баланс: *${usersData[userId].points}* баллов`, { parse_mode: "Markdown" });
});

// **API для WebApp (получение данных о таймере и балансе)**
app.get("/api/user/:userId", (req, res) => {
    const userId = req.params.userId;
    if (!usersData[userId]) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json({
        endTime: usersData[userId].endTime,
        points: usersData[userId].points,
    });
});

// **Обработчик получения баллов за нажатие на "GO"**
app.post("/api/user/:userId/add-points", express.json(), (req, res) => {
    const userId = req.params.userId;
    if (!usersData[userId]) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    usersData[userId].points += 5;
    saveData();
    res.json({ points: usersData[userId].points });
});

// **Обработчик GET-запросов для корневого маршрута `/`**
app.get("/", (req, res) => {
    res.send("Привет! WebApp работает корректно. 🚀");
});

// **Подключаем статические файлы для WebApp**
app.use(express.static(path.join(__dirname, "public")));

// **Настройка Webhook**
app.use(express.json());
app.post(WEBHOOK_PATH, (req, res) => {
    bot.handleUpdate(req.body, res);
});

// **Запускаем Webhook-сервер**
app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    await bot.telegram.setWebhook(WEBHOOK_URL);
    console.log("Webhook установлен! 🚀");
});