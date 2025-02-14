require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = `/bot${process.env.BOT_TOKEN}`;
const WEBHOOK_URL = `${process.env.WEBAPP_URL}${WEBHOOK_PATH}`;

// Храним пользователей в файле (на старте загружаем данные)
let usersData = {};
const DATA_FILE = "users.json";

// Загружаем сохранённые данные
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

    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${years} г. ${months} мес. ${days} д. ${hours} ч. ${minutes} м. ${seconds} с.`;
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
        `Нажми кнопку, чтобы открыть WebApp и следить за временем!`,
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

// **Команда /timer — показывает оставшееся время**
bot.command("timer", (ctx) => {
    const userId = ctx.from.id;

    if (!usersData[userId]) {
        return ctx.reply("Ты ещё не запустил таймер! Используй /start.");
    }

    ctx.reply(
        `⏳ *Твой таймер*\n\n🕰 Осталось: *${getTimeLeft(usersData[userId].endTime)}*`,
        { parse_mode: "Markdown" }
    );
});

// **Чек-ин (подтверждение дня)**
bot.command("checkin", (ctx) => {
    const userId = ctx.from.id;
    const today = new Date().toISOString().split("T")[0];

    if (!usersData[userId]) {
        return ctx.reply("Ты ещё не запустил таймер! Используй /start.");
    }

    if (usersData[userId].lastCheckIn === today) {
        return ctx.reply("Ты уже подтвердил день сегодня! Возвращайся завтра. ⏳");
    }

    usersData[userId].lastCheckIn = today;
    usersData[userId].points += 5;
    saveData();

    ctx.reply(`✅ День подтверждён! Ты получил +5 баллов. 🎉\n🕰 Осталось: *${getTimeLeft(usersData[userId].endTime)}*`, { parse_mode: "Markdown" });
});

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